import { Router, type IRouter } from "express";
import { GenerateChallengesBody, VerifyChallengePhotoBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  type Area,
  type AreaBand,
  type GeneratedMission,
  buildFewShot,
  buildInterestHint,
  defaultMinutesForLevel,
  enforceComposition,
  hasParallelActivities,
  repairMission,
  selectDiverseFallbackMissions,
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


const SYSTEM_PROMPT = `당신은 고립 청년의 회복을 돕는 미션 설계자입니다. 아래 '오늘 조건'과 '사용자 맥락', '선택 영역'과 '다양성 후보 영역'을 근거로 오늘의 미션 4개를 생성하세요.

[구성 — 매우 중요]
- 총 4개를 만든다: 2개는 '선택 영역'에서(난이도를 서로 다르게, 낮음·높음), 2개는 '다양성 후보 영역'에서.
- 다양성 2개는 오늘 컨디션·관심사에 가장 잘 맞는 후보 영역에서 고른다.
  · 후보 영역이 2개 이상이면 서로 다른 두 영역에서 1개씩 만든다.
  · 후보 영역이 1개뿐이면 그 영역에서 서로 다른 2개를 만든다.
  · 후보 영역이 없다고 표시되면 4개 모두 선택 영역에서 난이도를 펴 서로 다르게 만든다.
- 각 미션의 "area"는 그 미션이 실제로 속한 영역 코드(rhythm/selfcare/relationship/social)로 정확히 표기한다.
- 각 미션은 그 영역에 대해 제공된 난이도 범위(L#~#)를 벗어나지 않는다.
- 4개는 문구·소재·난이도·소요시간이 서로 겹치지 않게 만든다.

[생성 원리]
- 개별 문장을 고정하지 말고 "카테고리 뼈대 × 변주 살"로 매번 다르게 만든다.
- 열린 카테고리 중 영역·난이도에 맞는 것을 고르고, 취향(관심사)·형식(기록/탐색/행동)·시간대(아침/낮/저녁/자기 전)·소재(사용자가 이미 하는 활동)를 조합한다.
- 씨앗(시드)은 참고용 예시일 뿐, 그대로 복붙하지 말고 변주한다.

[구성 규칙]
- 3개 중 정확히 2개에만 관심사(취향)를 자연스럽게 녹인다. 나머지 1개는 관심사 단어를 전혀 쓰지 않은 일반적인 미션으로 만든다(관심사가 3개 모두에 들어가면 안 됨).
- 3개 중 1개 이상은 완료 후 사진 한 장으로 남길 수 있는 미션으로 만든다 — 그 활동 하나만으로 눈에 보이는 결과물이나 장면이 생기는 것(예: 정리된 자리, 직접 쓴 메모, 창가에서 본 풍경). 사진을 위해 활동을 추가하거나 잇지 말고, "사진 찍기"를 미션 내용에 넣지도 않는다(한 활동 원칙 유지).

[한 활동 원칙 — 매우 중요]
- 한 미션 = 한 가지 활동만. 하나의 미션에 서로 다른 두 활동을 함께 요구하지 않는다.
  · 불인정(금지): "산책도 하고 달리기도 하기", "커튼 열고 물 마시기", "청소하면서 음악 듣기" (활동 두 개 병렬)
  · 인정(허용): "좋아하는 것 3가지 찾기" (한 활동을 여러 대상에 적용), "세수 또는 양치하기" (둘 중 하나 선택)
- '그리고/및/~하고 ~하기/~하면서/~한 뒤/~하고 나서/~한 채/~틀어둔 채' 같이 두 활동을 잇거나 겹치는 표현을 쓰지 않는다.

[안전·가드레일 — 반드시 준수]
- 각 미션의 영역과 난이도밴드를 벗어나지 않는다. 5~15분 내 끝나는 아주 작은 행동.
- 금지조건에 해당하는 행동(대면·전화·외출 등)은 절대 포함하지 않는다. 게이트가 닫힌 카테고리는 쓰지 않는다.
- 무비용: 결제·구매·유료 미션 금지(무료 정보 탐색은 허용). 무낙인: 고립/은둔/환자 등 규정 언어 금지.
- 컨디션=바닥이면 밴드 -1 및 기록형(쓰기·고르기·표시) 위주로.
- 지시·명령·평가·비교·재촉 표현 금지("~해야 한다", "왜 안 했나요", "꼭·반드시·매일" 금지). 담백·따뜻하게.
- 추상적 조언("긍정적으로 생각하기") 금지. 구체적·실행가능하게. 회고질문 한 줄 포함.

[출력]
- 출력은 JSON 배열 4개만. 다른 텍스트 없이 배열만 출력:
[{ "area": "...", "level": n, "title": "미션 문구", "minutes": n, "reflect_q": "완료 후 한 줄 회고 질문" }]`;

router.post("/challenges/generate", async (req, res) => {
  const parsed = GenerateChallengesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "잘못된 요청이에요." });
    return;
  }
  const body = parsed.data;
  const area = body.area as Area;

  const selected: AreaBand = {
    area,
    bandLow: body.bandLow,
    bandHigh: body.bandHigh,
  };
  const diversity: AreaBand[] = (body.diversityAreas ?? []).map((d) => ({
    area: d.area as Area,
    bandLow: d.bandLow,
    bandHigh: d.bandHigh,
  }));
  const hasDiversity = diversity.length > 0;
  // 다양성 후보가 없으면 4개 모두 선택 영역에서 채운다.
  const targetSelected = hasDiversity ? 2 : 4;
  const targetDiversity = hasDiversity ? 2 : 0;

  const fallback = () =>
    res.json({
      challenges: selectDiverseFallbackMissions({
        selected,
        diversity,
        forbidden: body.forbidden,
        condition: body.condition,
        interest: body.interest,
      }),
      source: "fallback",
    });

  const interestHint = buildInterestHint(body.interest, area);
  const selectedFewShot = buildFewShot({
    area,
    bandLow: selected.bandLow,
    bandHigh: selected.bandHigh,
    forbidden: body.forbidden,
    condition: body.condition,
  });
  const diversityBlock = hasDiversity
    ? diversity
        .map((d) => {
          const fs = buildFewShot({
            area: d.area,
            bandLow: d.bandLow,
            bandHigh: d.bandHigh,
            forbidden: body.forbidden,
            condition: body.condition,
          });
          return `▶ ${AREA_KO[d.area]} (area="${d.area}", L${d.bandLow}~${d.bandHigh})\n${fs}`;
        })
        .join("\n\n")
    : "(다양성 후보 영역 없음 — 4개 모두 선택 영역에서 만든다)";

  const userPrompt = `회복단계: ${STAGE_KO[body.stage] ?? body.stage}
선택 영역: ${AREA_KO[area]} (area="${area}", L${selected.bandLow}~${selected.bandHigh}) — 여기서 ${targetSelected}개
금지조건: ${body.forbidden.length > 0 ? body.forbidden.join(", ") : "없음"}
[온보딩 정보] 수면: ${body.sleep} / 외출부담: ${body.outing} / 대인접촉부담: ${body.contact}
[오늘 설문] 컨디션: ${body.condition} / 희망영역: ${AREA_KO[area]} / 관심사: ${body.interest}
[취향 반영 힌트] ${interestHint}

[선택 영역 열린 카테고리 & 시드 — 그대로 쓰지 말고 변주할 것]
${selectedFewShot}

[다양성 후보 영역 — 컨디션·관심사에 맞게 ${targetDiversity}개, 각 영역 난이도 범위 준수]
${diversityBlock}`;

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
    if (!Array.isArray(items) || items.length < 4) throw new Error("bad-shape");

    // 허용 영역별 난이도 범위(선택 + 다양성 후보). 각 미션은 자기 영역 범위로만 클램프.
    const allowed = new Map<Area, { low: number; high: number }>();
    allowed.set(selected.area, { low: selected.bandLow, high: selected.bandHigh });
    for (const d of diversity) {
      allowed.set(d.area, { low: d.bandLow, high: d.bandHigh });
    }

    const clampToBand = (lv: unknown, low: number, high: number, fb: number) => {
      const n = typeof lv === "number" ? Math.round(lv) : fb;
      return Math.min(high, Math.max(low, Math.min(5, Math.max(1, n))));
    };

    const usedTitles = new Set<string>();
    const selectedOut: GeneratedMission[] = [];
    const diversityOut: GeneratedMission[] = [];
    // 다양성 후보가 2개 이상이면 서로 다른 두 영역에서 1개씩(폴백 규칙과 동일).
    // 후보가 1개면 그 영역에서 targetDiversity개까지 허용.
    const diversityPerAreaCap = diversity.length >= 2 ? 1 : targetDiversity;
    const diversityAreaCounts = new Map<Area, number>();

    for (const it of items) {
      const title = typeof it.title === "string" ? it.title.trim() : "";
      if (!title) continue;
      const aRaw = it.area;
      if (typeof aRaw !== "string" || !allowed.has(aRaw as Area)) continue;
      const a = aRaw as Area;
      const isSelected = a === selected.area;
      const bucket = isSelected ? selectedOut : diversityOut;
      const cap = isSelected ? targetSelected : targetDiversity;
      if (bucket.length >= cap) continue;
      if (!isSelected && (diversityAreaCounts.get(a) ?? 0) >= diversityPerAreaCap)
        continue; // 다양성 영역 편중 방지

      const band = allowed.get(a)!;
      const level = clampToBand(it.level, band.low, band.high, band.low + bucket.length);
      const reflectQ =
        (typeof it.reflect_q === "string" && it.reflect_q.trim()) ||
        (typeof it.reflectQ === "string" && it.reflectQ.trim()) ||
        "오늘 해보니 어땠어요?";
      const minutes =
        typeof it.minutes === "number" && it.minutes > 0
          ? Math.min(30, Math.round(it.minutes))
          : defaultMinutesForLevel(level);

      let mission: GeneratedMission = { area: a, level, title, minutes, reflectQ };
      // 한 활동 가드: 병렬 활동 감지 시 해당 영역의 검증 시드로 교체
      if (hasParallelActivities(title)) {
        mission = repairMission(mission, {
          area: a,
          bandLow: band.low,
          bandHigh: band.high,
          forbidden: body.forbidden,
          condition: body.condition,
          interest: body.interest,
          avoidTitles: usedTitles,
        });
      }
      if (usedTitles.has(mission.title)) continue; // 제목 중복 제거
      usedTitles.add(mission.title);
      bucket.push(mission);
      if (!isSelected)
        diversityAreaCounts.set(a, (diversityAreaCounts.get(a) ?? 0) + 1);
    }

    // 구성(선택 N + 다양성 M)이 안 채워지면 폴백 뱅크(검증 시드)로 안전하게 대체
    if (
      selectedOut.length < targetSelected ||
      diversityOut.length < targetDiversity
    ) {
      throw new Error("incomplete-composition");
    }

    const challenges = [...selectedOut, ...diversityOut];

    // 최종 검증: 수리 후에도 한 활동 원칙 위반이 남아 있으면 전체를 폴백 세트로 대체
    if (challenges.some((c) => hasParallelActivities(c.title))) {
      throw new Error("parallel-activity-after-repair");
    }

    // 구성 규칙 결정 적용: 취향 반영 정확히 2개 + 일반 1개, 사진 인증 가능 1개 이상.
    const balanced = enforceComposition(challenges, {
      area,
      bandLow: body.bandLow,
      bandHigh: body.bandHigh,
      forbidden: body.forbidden,
      condition: body.condition,
      interest: body.interest,
    });

    res.json({ challenges: balanced, source: "llm" });
  } catch (err) {
    req.log.warn({ err }, "challenge generation fell back to bank");
    fallback();
  }
});

const FALLBACK_PRAISES = [
  "오늘 이만큼 해낸 것, 정말 멋져요.",
  "작은 한 걸음이 모여 큰 변화가 돼요. 잘했어요.",
  "사진까지 남겨줘서 고마워요. 오늘의 조각, 잘 채웠어요.",
  "천천히, 그리고 확실하게 해냈네요. 대단해요.",
  "오늘 하루에 이 순간을 만들어낸 게 참 좋아요.",
];

const pickFallbackPraise = (nickname?: string) => {
  const base = FALLBACK_PRAISES[Math.floor(Math.random() * FALLBACK_PRAISES.length)];
  return nickname ? `${nickname}님, ${base}` : base;
};

const PHOTO_SYSTEM_PROMPT = `당신은 회복 중인 청년을 따뜻하게 응원하는 동반자입니다. 사용자가 오늘의 작은 미션을 마치고 인증 사진을 올렸습니다.

[역할]
- 사진을 너그럽게 보고, 사진에서 보이는 것을 한 가지 짚으며 따뜻한 칭찬 한두 문장을 만듭니다.
- 사진이 미션과 직접 관련이 없어 보여도 절대 지적하거나 실패로 취급하지 않습니다. 사진을 올린 용기와 오늘의 시도 자체를 칭찬하세요.

[규칙 — 반드시 준수]
- 고립/은둔/환자 같은 규정 언어, 난이도 숫자, 평가·비교·재촉 표현("~해야 한다", "꼭", "매일") 금지.
- 지시나 조언 없이 담백하고 따뜻하게. 존댓말. 1~2문장, 60자 이내.
- 출력은 칭찬 문장만. 따옴표나 다른 텍스트 없이.`;

router.post("/challenges/verify-photo", async (req, res) => {
  const parsed = VerifyChallengePhotoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "잘못된 요청이에요." });
    return;
  }
  const { imageDataUrl, title, nickname } = parsed.data;

  if (!/^data:image\/(jpeg|png|webp);base64,/.test(imageDataUrl)) {
    res.status(400).json({ error: "지원하지 않는 이미지 형식이에요." });
    return;
  }
  // 클라이언트는 최대 1024px JPEG로 축소해 보냄 — 그보다 훨씬 큰 페이로드는 거부
  if (imageDataUrl.length > 4_000_000) {
    res.status(400).json({ error: "사진이 너무 커요. 다시 시도해 주세요." });
    return;
  }

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("llm-timeout")), 12000),
    );
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-5.4-mini",
        max_completion_tokens: 1024,
        messages: [
          { role: "system", content: PHOTO_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `오늘의 미션: ${title}${nickname ? `\n닉네임: ${nickname}` : ""}\n이 인증 사진을 보고 따뜻한 칭찬 한두 문장을 만들어 주세요.`,
              },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
      timeout,
    ]);

    const praise = (completion.choices[0]?.message?.content ?? "").trim();
    if (!praise) throw new Error("empty-praise");

    // 결정적 가드: 규정 언어·난이도 표기·연속(스트릭) 프레이밍이 섞이면 폴백 사용
    if (/고립|은둔|환자/.test(praise)) throw new Error("stigma-language");
    if (/난이도|레벨|L[1-5]\b|[1-5]\s*단계/.test(praise)) throw new Error("difficulty-language");
    if (/연속|매일|\d+\s*일째|스트릭|streak/i.test(praise)) throw new Error("streak-language");

    res.json({ praise: praise.slice(0, 200), source: "llm" });
  } catch (err) {
    // 프라이버시: 오류 객체에 요청 페이로드(사진 데이터)가 섞일 수 있어 메시지만 기록
    const reason = err instanceof Error ? err.message : "unknown";
    req.log.warn({ reason }, "photo praise fell back to preset list");
    res.json({ praise: pickFallbackPraise(nickname), source: "fallback" });
  }
});

export default router;
