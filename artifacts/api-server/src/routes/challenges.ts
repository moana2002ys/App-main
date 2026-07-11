import { Router, type IRouter } from "express";
import { GenerateChallengesBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  type Area,
  buildFewShot,
  buildInterestHint,
  defaultMinutesForLevel,
  hasParallelActivities,
  repairMission,
  selectFallbackMissions,
} from "@workspace/mission-bank";

const router: IRouter = Router();

const AREA_KO: Record<Area, string> = {
  rhythm: "생활리듬",
  selfcare: "신체·정서 건강(자기돌봄)",
  relationship: "관계",
  social: "사회진입(경제·활동)",
};

const STAGE_KO: Record<string, string> = {
  secluded: "은둔",
  highly_isolated: "고도고립",
  at_risk: "고립위험군",
  not_at_risk: "비위험군",
};


const SYSTEM_PROMPT = `당신은 고립 청년의 회복을 돕는 미션 설계자입니다. 아래 '오늘 조건'과 '사용자 맥락', 그리고 '열린 카테고리'를 근거로 오늘의 미션 3개를 생성하세요(같은 영역, 난이도 낮음→중간→높음 순).

[생성 원리]
- 개별 문장을 고정하지 말고 "카테고리 뼈대 × 변주 살"로 매번 다르게 만든다.
- 열린 카테고리 중 희망영역·난이도에 맞는 것을 고르고, 취향(관심사)·형식(기록/탐색/행동)·시간대(아침/낮/저녁/자기 전)·소재(사용자가 이미 하는 활동)를 조합해 서로 다른 3개를 만든다.
- 씨앗(시드)은 참고용 예시일 뿐, 그대로 복붙하지 말고 변주한다.

[한 활동 원칙 — 매우 중요]
- 한 미션 = 한 가지 활동만. 하나의 미션에 서로 다른 두 활동을 함께 요구하지 않는다.
  · 불인정(금지): "산책도 하고 달리기도 하기", "커튼 열고 물 마시기", "청소하면서 음악 듣기" (활동 두 개 병렬)
  · 인정(허용): "좋아하는 것 3가지 찾기" (한 활동을 여러 대상에 적용), "세수 또는 양치하기" (둘 중 하나 선택)
- '그리고/및/~하고 ~하기/~하면서' 같이 두 활동을 잇는 표현을 쓰지 않는다.

[안전·가드레일 — 반드시 준수]
- 미션영역과 난이도밴드를 벗어나지 않는다. 5~15분 내 끝나는 아주 작은 행동.
- 금지조건에 해당하는 행동(대면·전화·외출 등)은 절대 포함하지 않는다. 게이트가 닫힌 카테고리는 쓰지 않는다.
- 무비용: 결제·구매·유료 미션 금지(무료 정보 탐색은 허용). 무낙인: 고립/은둔/환자 등 규정 언어 금지.
- 컨디션=바닥이면 밴드 -1 및 기록형(쓰기·고르기·표시) 위주로.
- 지시·명령·평가·비교·재촉 표현 금지("~해야 한다", "왜 안 했나요", "꼭·반드시·매일" 금지). 담백·따뜻하게.
- 추상적 조언("긍정적으로 생각하기") 금지. 구체적·실행가능하게. 회고질문 한 줄 포함.

[출력]
- 출력은 JSON 배열 3개만. 다른 텍스트 없이 배열만 출력:
[{ "area": "...", "level": n, "title": "미션 문구", "minutes": n, "reflect_q": "완료 후 한 줄 회고 질문" }]`;

router.post("/challenges/generate", async (req, res) => {
  const parsed = GenerateChallengesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "잘못된 요청이에요." });
    return;
  }
  const body = parsed.data;
  const area = body.area as Area;

  const fallback = () =>
    res.json({
      challenges: selectFallbackMissions({
        area,
        bandLow: body.bandLow,
        bandHigh: body.bandHigh,
        forbidden: body.forbidden,
        condition: body.condition,
        interest: body.interest,
      }),
      source: "fallback",
    });

  const fewShot = buildFewShot({
    area,
    bandLow: body.bandLow,
    bandHigh: body.bandHigh,
    forbidden: body.forbidden,
    condition: body.condition,
  });
  const interestHint = buildInterestHint(body.interest, area);

  const userPrompt = `회복단계: ${STAGE_KO[body.stage] ?? body.stage}
미션영역: ${AREA_KO[area]}
난이도밴드: L${body.bandLow} ~ L${body.bandHigh} (낮음·중간·높음 각 1개)
금지조건: ${body.forbidden.length > 0 ? body.forbidden.join(", ") : "없음"}
[온보딩 정보] 수면: ${body.sleep} / 외출부담: ${body.outing} / 대인접촉부담: ${body.contact}
[오늘 설문] 컨디션: ${body.condition} / 희망영역: ${AREA_KO[area]} / 관심사: ${body.interest}
[취향 반영 힌트] ${interestHint}
[열린 카테고리 & 시드 — 그대로 쓰지 말고 변주할 것]
${fewShot}`;

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("llm-timeout")), 5000),
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
      area?: string;
      level?: number;
      title?: string;
      minutes?: number;
      reflect_q?: string;
      reflectQ?: string;
    }>;
    if (!Array.isArray(items) || items.length < 3) throw new Error("bad-shape");

    const clampLevel = (lv: unknown, idx: number) => {
      const n = typeof lv === "number" ? Math.round(lv) : body.bandLow + idx;
      return Math.min(
        body.bandHigh,
        Math.max(body.bandLow, Math.min(5, Math.max(1, n))),
      );
    };

    const avoidTitles = new Set<string>();
    const challenges = items.slice(0, 3).map((it, idx) => {
      const title = typeof it.title === "string" ? it.title.trim() : "";
      const reflectQ =
        (typeof it.reflect_q === "string" && it.reflect_q.trim()) ||
        (typeof it.reflectQ === "string" && it.reflectQ.trim()) ||
        "오늘 해보니 어땠어요?";
      if (!title) throw new Error("missing-title");
      const level = clampLevel(it.level, idx);
      const minutes =
        typeof it.minutes === "number" && it.minutes > 0
          ? Math.min(30, Math.round(it.minutes))
          : defaultMinutesForLevel(level);

      let mission = { area, level, title, minutes, reflectQ };
      // 한 활동 가드: 병렬 활동 감지 시 폴백 시드로 교체
      if (hasParallelActivities(title)) {
        mission = repairMission(mission, {
          area,
          bandLow: body.bandLow,
          bandHigh: body.bandHigh,
          forbidden: body.forbidden,
          condition: body.condition,
          interest: body.interest,
          avoidTitles,
        });
      }
      avoidTitles.add(mission.title);
      return mission;
    });

    challenges.sort((a, b) => a.level - b.level);

    // 최종 검증: 수리 후에도 한 활동 원칙 위반이 남아 있으면 전체를 폴백 세트(검증된 시드)로 대체
    if (challenges.some((c) => hasParallelActivities(c.title))) {
      throw new Error("parallel-activity-after-repair");
    }

    res.json({ challenges, source: "llm" });
  } catch (err) {
    req.log.warn({ err }, "challenge generation fell back to bank");
    fallback();
  }
});

export default router;
