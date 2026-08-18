import { Router, type IRouter } from "express";
import { z } from "zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  type Area,
  CATEGORIES,
  hasParallelActivities,
} from "@workspace/mission-bank";

// ── /api/daily-plan — v2 슬롯 문구의 LLM 무한 변주 ────────────
// 원칙: 뼈대는 알고리즘, 살은 LLM, 검문은 코드.
//  - 클라이언트 planTodaySlots가 확정한 스켈레톤(영역·레벨·카테고리·kind)은 불변.
//  - LLM은 각 자리의 "문구·분량·회고질문"만 생성한다. 강도 변형(가볍게/도전)도 함께.
//  - 슬롯별 검증: 한 활동 원칙, 금지어, 신선도(최근 제목과 유사 금지), 분량 클램프.
//    실패한 슬롯만 스켈레톤(시드 엔진) 문구로 남긴다 — 전체 폴백 아님.
//  - LLM 타임아웃/실패 시 전체가 스켈레톤 그대로(source: "fallback") — 앱은 항상 돈다.

const router: IRouter = Router();

const AREA_KO: Record<Area, string> = {
  rhythm: "생활리듬",
  selfcare: "신체·정서(자기돌봄)",
  relationship: "관계",
  social: "사회진입(경제·활동)",
};

// 슬롯 종류별 생성 의도 — LLM에게 톤을 지시한다.
const KIND_INTENT: Record<string, string> = {
  target: "오늘의 방향과 이어지는 기본 조각",
  pleasure: "즐거움이 목적인 조각(부담 최소, 좋아하는 소재 적극 활용)",
  avoidance: "미뤄왔던 것을 아주 작게 다시 만나는 조각(문턱 최소화, 재촉 금지)",
  explore: "본인이 궁금하다고 연 새 영역의 첫 조각(가장 가볍게, 환영하는 톤)",
};

const SlotSchema = z.object({
  id: z.string(),
  kind: z.enum(["target", "pleasure", "avoidance", "explore", "self"]),
  area: z.enum(["rhythm", "selfcare", "relationship", "social"]),
  level: z.number().int().min(1).max(5),
  categoryId: z.string().optional(),
  title: z.string(),
  minutes: z.number(),
  reflectQ: z.string(),
});

const DailyPlanBody = z.object({
  stage: z.string(),
  condition: z.string(),
  mood: z.number().int().min(1).max(5),
  forbidden: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  // 구체화된 관심사(관심사 사다리) — [{category, label, source}] source: asked|typed|inferred
  interestSpecifics: z
    .array(
      z.object({
        category: z.string(),
        label: z.string(),
        source: z.string(),
      }),
    )
    .default([]),
  // 신선도 가드: 최근 노출·완료된 미션 제목들(2~3주). 이것들과 비슷하면 안 된다.
  recentTitles: z.array(z.string()).max(200).default([]),
  // 취향 few-shot: P/M을 높게 준 완료 미션 제목들.
  likedTitles: z.array(z.string()).max(20).default([]),
  slots: z.array(SlotSchema).min(1).max(8),
});

// 결정적 금지어(무비용·안전 원칙) — 프롬프트와 별개로 코드가 최종 차단.
const BANNED = /구매|결제|주문|유료|술|담배|밤새|자해|다이어트/;

// 신선도: 정규화 토큰 자카드 유사도. 0.6 이상이면 "비슷한 미션"으로 거부.
function tokenize(s: string): Set<string> {
  // 한 글자 토큰(물·컵·한)도 유지 — 한국어 미션 문구는 짧아서 버리면 유사도가 과소평가된다.
  return new Set(
    s
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 1),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

function tooSimilar(title: string, against: string[]): boolean {
  const t = tokenize(title);
  return against.some((x) => jaccard(t, tokenize(x)) >= 0.6);
}

// 슬롯 문구 하나의 결정적 검증 — 실패 사유를 돌려준다(로그·디버그용).
function validateTitle(
  title: string,
  avoid: string[],
): { ok: boolean; reason?: string } {
  const t = title.trim();
  if (t.length < 4 || t.length > 48) return { ok: false, reason: "length" };
  if (hasParallelActivities(t)) return { ok: false, reason: "parallel" };
  if (BANNED.test(t)) return { ok: false, reason: "banned" };
  if (tooSimilar(t, avoid)) return { ok: false, reason: "similar" };
  return { ok: true };
}

const SYSTEM_PROMPT = `당신은 고립 청년의 회복을 돕는 미션 문구 작가입니다. 이미 확정된 오늘의 계획 뼈대(슬롯별 영역·난이도·카테고리·역할)가 주어집니다. 당신의 일은 각 슬롯의 "문구"를 새로 쓰는 것뿐입니다.

[절대 규칙]
- 슬롯의 영역·난이도(L1~5)·역할은 바꿀 수 없다. 문구만 만든다.
- 한 미션 = 한 가지 활동만. 두 활동을 잇거나(~하고, ~한 뒤) 겹치지(~하면서, ~한 채) 않는다.
- 무비용: 결제·구매·유료 활동 금지. 금지조건(대면·전화·외출 등 명시된 것) 관련 행동 금지.
- 지시·평가·재촉 금지("~해야 한다", "꼭", "반드시"). 담백하고 따뜻하게. 낙인 언어(고립·은둔·환자) 금지.
- L1=1~2분 초미니 행동, L3=5분 내외, L5=15분 내외의 도전. 난이도가 문구에 실제로 느껴져야 한다.

[신선도 — 매우 중요]
- '최근에 한 미션' 목록과 소재·표현이 비슷하면 안 된다. 같은 카테고리라도 형식(기록/탐색/행동), 시간대, 소재를 바꿔 새롭게 만든다.
- 오늘 슬롯들끼리도 소재·문구가 겹치지 않게 한다.

[개인화]
- 관심사와 구체 취향(본인이 직접 말한 것 우선)을 자연스럽게 소재로 쓴다. 단, 오늘 슬롯 중 1개 이상은 관심사 없는 일반 미션으로 남긴다.
- '좋아했던 미션' 목록은 이 사람에게 잘 맞았던 결이다 — 그 결을 참고하되 복붙하지 않는다.
- 구체 취향(예: 특정 밴드·게임 이름)은 소재로만 쓴다. 해당 서비스 가입·지출을 요구하지 않는다.

[강도 변형]
- 각 슬롯마다 본문 외에 "light"(한 단계 가볍게)와 "challenge"(한 단계 도전) 변형 문구를 만든다.
- 변형은 같은 활동의 강도만 조절한다(범위·시간·깊이). 예: "일어난 시간 기록" → challenge: "일어난 시간 기록을 3일째 이어가기". 새 활동을 덧붙이지 않는다.

[출력]
JSON 배열만 출력. 슬롯 순서대로:
[{ "index": 0, "title": "...", "minutes": n, "reflect_q": "완료 후 한 줄 회고 질문", "light": "...", "challenge": "..." }]`;

router.post("/daily-plan", async (req, res) => {
  const parsed = DailyPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "잘못된 요청이에요." });
    return;
  }
  const body = parsed.data;

  // 폴백 = 스켈레톤 그대로(시드 엔진 문구). LLM은 실패해도 앱은 돈다.
  const fallback = () =>
    res.json({
      slots: body.slots.map((s) => ({
        id: s.id,
        title: s.title,
        minutes: s.minutes,
        reflectQ: s.reflectQ,
      })),
      source: "fallback",
    });

  const specificsLine =
    body.interestSpecifics.length > 0
      ? body.interestSpecifics
          .map((s) => `${s.category} > ${s.label}${s.source === "typed" ? "(본인 표현)" : ""}`)
          .join(", ")
      : "(아직 없음 — 카테고리 수준만 사용)";

  const slotBlocks = body.slots
    .map((s, i) => {
      const cat = s.categoryId
        ? CATEGORIES.find((c) => c.id === s.categoryId)
        : undefined;
      const catLine = cat
        ? `카테고리: ${cat.name} (변주 힌트: ${cat.variationHint ?? "형식·시간대·소재 변주"}) / 씨앗 예시(복붙 금지): ${cat.seeds.slice(0, 2).join(" · ")}`
        : "카테고리: 자유(영역 안에서)";
      return `[슬롯 ${i}] 역할: ${KIND_INTENT[s.kind] ?? s.kind} / 영역: ${AREA_KO[s.area]} / 난이도: L${s.level}
${catLine}
현재 시드 문구(이보다 새롭게): ${s.title}`;
    })
    .join("\n\n");

  const userPrompt = `회복단계: ${body.stage} / 오늘 컨디션: ${body.condition} (기분 ${body.mood}/5)
금지조건: ${body.forbidden.length > 0 ? body.forbidden.join(", ") : "없음"}
관심사: ${body.interests.length > 0 ? body.interests.join(", ") : "없음"}
구체 취향: ${specificsLine}
좋아했던 미션(결 참고): ${body.likedTitles.length > 0 ? body.likedTitles.slice(0, 8).join(" / ") : "(데이터 없음)"}

[최근에 한 미션 — 이것들과 비슷하면 안 됨]
${body.recentTitles.length > 0 ? body.recentTitles.slice(0, 60).join(" / ") : "(없음)"}

[오늘의 슬롯 뼈대 — 순서 유지, 문구만 생성]
${slotBlocks}`;

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("llm-timeout")), 6000),
    );
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-5.4-mini",
        max_completion_tokens: 8192,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
      timeout,
    ]);

    const raw = completion.choices[0]?.message?.content ?? "";
    const jsonText = raw.replace(/```json|```/g, "").trim();
    const start = jsonText.indexOf("[");
    const end = jsonText.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("no-json-array");
    const items = JSON.parse(jsonText.slice(start, end + 1)) as Array<{
      index?: number;
      title?: string;
      minutes?: number;
      reflect_q?: string;
      light?: string;
      challenge?: string;
    }>;
    if (!Array.isArray(items)) throw new Error("bad-shape");

    // 슬롯별 검증·병합. 오늘 확정된 제목들도 서로의 신선도 검사 대상에 누적.
    const usedToday: string[] = [];
    const out = body.slots.map((s, i) => {
      const it = items.find((x) => x.index === i) ?? items[i];
      const seed = {
        id: s.id,
        title: s.title,
        minutes: s.minutes,
        reflectQ: s.reflectQ,
      };
      if (!it || typeof it.title !== "string") {
        usedToday.push(seed.title);
        return seed;
      }
      const title = it.title.trim();
      const check = validateTitle(title, [...body.recentTitles, ...usedToday]);
      if (!check.ok) {
        usedToday.push(seed.title);
        return seed; // 이 슬롯만 시드 문구 유지
      }
      usedToday.push(title);
      const minutes =
        typeof it.minutes === "number" && it.minutes > 0
          ? Math.min(30, Math.round(it.minutes))
          : s.minutes;
      const reflectQ =
        (typeof it.reflect_q === "string" && it.reflect_q.trim()) || s.reflectQ;
      // 강도 변형은 선택적 보너스 — 검증 실패 시 그냥 뺀다(클라이언트가 시드 변주로 폴백).
      const variants: { light?: string; challenge?: string } = {};
      if (
        typeof it.light === "string" &&
        validateTitle(it.light.trim(), usedToday).ok
      ) {
        variants.light = it.light.trim();
      }
      if (
        typeof it.challenge === "string" &&
        validateTitle(it.challenge.trim(), usedToday).ok
      ) {
        variants.challenge = it.challenge.trim();
      }
      return {
        id: s.id,
        title,
        minutes,
        reflectQ,
        ...(variants.light || variants.challenge ? { variants } : {}),
      };
    });

    res.json({ slots: out, source: "llm" });
  } catch {
    fallback();
  }
});

export default router;
