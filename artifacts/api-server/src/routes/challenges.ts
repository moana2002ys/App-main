import { Router, type IRouter } from "express";
import { GenerateChallengesBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

type Area = "rhythm" | "selfcare" | "relationship" | "social";

interface BankItem {
  title: string;
  minutes: number;
  reflectQ: string;
}

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

const BANK: Record<Area, Record<number, BankItem[]>> = {
  rhythm: {
    1: [
      { title: "오늘 일어난 시간 기록하기", minutes: 1, reflectQ: "기록할 때 기분이 어땠나요?" },
      { title: "창문 틈새로 들어오는 빛 느껴보기", minutes: 1, reflectQ: "빛을 느낄 때 기분이 어땠나요?" },
      { title: "물 한 모금 마시기", minutes: 1, reflectQ: "물을 마시니 어땠나요?" },
    ],
    2: [
      { title: "커튼 열기", minutes: 2, reflectQ: "커튼을 여니 어땠나요?" },
      { title: "물 한 컵 마시기", minutes: 2, reflectQ: "물을 마시니 몸이 깨는 느낌이었나요?" },
      { title: "방 환기시키기", minutes: 2, reflectQ: "바람을 쐬니 어땠나요?" },
    ],
    3: [
      { title: "기상 알람 하나 맞춰두기", minutes: 2, reflectQ: "알람을 맞추니 내일이 기대되나요?" },
      { title: "밤에 스마트폰 끄고 5분 눈 감기", minutes: 5, reflectQ: "눈을 감고 있으니 어땠나요?" },
      { title: "간단한 아침 식사 챙기기", minutes: 10, reflectQ: "아침을 먹으니 기분이 어땠나요?" },
    ],
    4: [
      { title: "아침 햇빛 5분 쬐기", minutes: 5, reflectQ: "햇빛을 쬐니 어땠나요?" },
      { title: "정해진 시간에 식사하기", minutes: 15, reflectQ: "시간을 지켜서 먹으니 어땠나요?" },
      { title: "가벼운 아침 산책", minutes: 10, reflectQ: "걷는 동안 뭐가 제일 괜찮았어요?" },
    ],
    5: [
      { title: "3일 연속 기상 시간 기록하기", minutes: 1, reflectQ: "연속으로 기록하니 어땠나요?" },
      { title: "하루 계획 간단히 세우기", minutes: 10, reflectQ: "계획을 세우니 어땠나요?" },
      { title: "나만의 저녁 루틴 만들기", minutes: 15, reflectQ: "루틴을 실천해보니 어땠나요?" },
    ],
  },
  selfcare: {
    1: [
      { title: "지금 기분 이모지 하나 고르기", minutes: 1, reflectQ: "고른 이모지가 지금 기분과 잘 맞나요?" },
      { title: "크게 심호흡 세 번 하기", minutes: 1, reflectQ: "심호흡을 하니 조금 편해졌나요?" },
      { title: "거울 보고 미소 지어보기", minutes: 1, reflectQ: "거울 속 내 모습은 어땠나요?" },
    ],
    2: [
      { title: "세수 또는 양치하기", minutes: 3, reflectQ: "개운해진 기분이 드나요?" },
      { title: "좋아하는 음악 한 곡 듣기", minutes: 5, reflectQ: "오늘 들은 음악은 어느 쪽이었어요?" },
      { title: "따뜻한 차 한 잔 마시기", minutes: 5, reflectQ: "차를 마시니 조금 안정되나요?" },
    ],
    3: [
      { title: "오늘 감정 한 줄 기록하기", minutes: 2, reflectQ: "감정을 글로 적어보니 어땠나요?" },
      { title: "좋아하는 글 한 쪽 읽기", minutes: 5, reflectQ: "오늘 읽은 글은 어느 쪽이었어요?" },
      { title: "방 한 구석 간단히 정리하기", minutes: 5, reflectQ: "정리된 곳을 보니 어땠나요?" },
    ],
    4: [
      { title: "10분 스트레칭 또는 샤워하기", minutes: 10, reflectQ: "몸을 움직이니 어땠나요?" },
      { title: "창가 화분·식물 돌보기", minutes: 5, reflectQ: "식물을 돌보니 어땠나요?" },
      { title: "나를 위한 작은 요리 해보기", minutes: 15, reflectQ: "다음에 또 한다면?" },
    ],
    5: [
      { title: "집 근처 10분 산책하기", minutes: 10, reflectQ: "걷는 동안 뭐가 제일 괜찮았어요?" },
      { title: "나에게 칭찬 한 마디 하기", minutes: 2, reflectQ: "칭찬을 들으니 기분이 어땠나요?" },
      { title: "평소 가보고 싶던 동네 카페 다녀오기", minutes: 30, reflectQ: "카페 분위기는 어땠나요?" },
    ],
  },
  relationship: {
    1: [
      { title: "가족·지인 메시지 하나 '읽음'만 하기", minutes: 1, reflectQ: "읽기만 해도 괜찮았나요?" },
      { title: "좋아하는 유튜버 영상 하나 보기", minutes: 10, reflectQ: "영상을 보니 기분이 어땠나요?" },
      { title: "고마웠던 사람 한 명 떠올려보기", minutes: 1, reflectQ: "떠올린 사람은 어떤 사람인가요?" },
    ],
    2: [
      { title: "관심 커뮤니티 글 1개 읽어보기", minutes: 5, reflectQ: "글을 읽어보니 어땠나요?" },
      { title: "가족에게 짧은 이모티콘 하나 보내기", minutes: 1, reflectQ: "보내고 나서 어땠나요?" },
      { title: "SNS 게시물에 '좋아요' 하나 누르기", minutes: 1, reflectQ: "좋아요를 누르니 어땠나요?" },
    ],
    3: [
      { title: "관심 글에 이모지/댓글 하나 남기기", minutes: 3, reflectQ: "댓글을 남겨보니 어땠나요?" },
      { title: "받은 메시지에 짧게 답장하기", minutes: 3, reflectQ: "답장을 보내니 어땠나요?" },
      { title: "친구의 프로필 사진 구경하기", minutes: 2, reflectQ: "친구의 일상을 보니 어땠나요?" },
    ],
    4: [
      { title: "안부 문자 한 통 보내기", minutes: 5, reflectQ: "문자를 보내보니 어땠나요?" },
      { title: "가족에게 '고마워' 한 마디 하기", minutes: 1, reflectQ: "말을 건네니 어땠나요?" },
      { title: "지인에게 근황 한 줄 전하기", minutes: 5, reflectQ: "근황을 전하니 어땠나요?" },
    ],
    5: [
      { title: "짧은 통화 한 번 걸어보기", minutes: 10, reflectQ: "목소리를 들으니 어땠나요?" },
      { title: "친구와 가벼운 차 한 잔 약속 잡기", minutes: 5, reflectQ: "약속을 잡으니 어땠나요?" },
      { title: "지인에게 안부 전화 한 통 하기", minutes: 10, reflectQ: "전화를 해보니 어땠나요?" },
    ],
  },
  social: {
    1: [
      { title: "관심 직무/분야 하나 골라보기", minutes: 3, reflectQ: "생각해본 분야는 어땠나요?" },
      { title: "책상 위 한 곳 정리하기", minutes: 5, reflectQ: "정리를 하니 기분이 어땠나요?" },
      { title: "인터넷 기사 제목 3개 읽기", minutes: 2, reflectQ: "새로운 소식을 보니 어땠나요?" },
    ],
    2: [
      { title: "관심 분야 정보 5분 탐색하기", minutes: 5, reflectQ: "새로운 정보를 알게 되니 어땠나요?" },
      { title: "관심 있는 책 목차 읽어보기", minutes: 5, reflectQ: "어떤 책이었나요?" },
      { title: "동네 도서관 위치 검색해보기", minutes: 2, reflectQ: "위치를 확인하니 어땠나요?" },
    ],
    3: [
      { title: "이력서 한 줄(내 강점) 써보기", minutes: 10, reflectQ: "내 강점을 적어보니 어땠나요?" },
      { title: "편의점·카페에서 직접 주문해보기", minutes: 15, reflectQ: "직접 주문하니 어땠나요?" },
      { title: "관심 있는 강의 1개 찜해두기", minutes: 5, reflectQ: "강의 내용을 보니 어땠나요?" },
    ],
    4: [
      { title: "지역 청년지원 정보 하나 확인·저장하기", minutes: 10, reflectQ: "도움이 될 것 같나요?" },
      { title: "관심 분야 블로그/기사 스크랩하기", minutes: 5, reflectQ: "스크랩한 내용을 보니 어땠나요?" },
      { title: "짧은 온라인 강의 1개 수강하기", minutes: 15, reflectQ: "새로운 걸 배우니 어땠나요?" },
    ],
    5: [
      { title: "희망 회사·프로그램 1곳 조사 + 요건 정리하기", minutes: 20, reflectQ: "구체적으로 찾아보니 어땠나요?" },
      { title: "이력서 양식 다운받아 첫 부분 채우기", minutes: 15, reflectQ: "이력서를 채우니 어땠나요?" },
      { title: "가까운 주민센터 방문해보기", minutes: 30, reflectQ: "다녀오니 어땠나요?" },
    ],
  },
};

function pickFromBank(area: Area, bandLow: number, bandHigh: number) {
  const lo = Math.min(5, Math.max(1, Math.min(bandLow, bandHigh)));
  const hi = Math.min(5, Math.max(1, Math.max(bandLow, bandHigh)));
  const mid = Math.min(hi, Math.max(lo, Math.round((lo + hi) / 2)));
  const usedTitles = new Set<string>();

  return [lo, mid, hi].map((lv) => {
    let pick = (BANK[area][lv] ?? []).find((i) => !usedTitles.has(i.title));
    if (!pick) {
      for (let l = lo; l <= hi && !pick; l++) {
        pick = (BANK[area][l] ?? []).find((i) => !usedTitles.has(i.title));
      }
    }
    const item = pick ?? BANK[area][lv]![0]!;
    usedTitles.add(item.title);
    return {
      area,
      level: lv,
      title: item.title,
      minutes: item.minutes,
      reflectQ: item.reflectQ,
    };
  });
}

const SYSTEM_PROMPT = `당신은 고립 청년의 회복을 돕는 챌린지 설계자입니다. 주어진 '챌린지 조건'과 '사용자 맥락'에 맞는 오늘의 챌린지 3개를 생성하세요(같은 영역, 난이도 낮음→중간→높음 순).
예시는 톤·난이도 참고용일 뿐이며, 그대로 쓰지 말고 사용자의 관심사와 오늘 상태를 반영해 개인화하세요.
반드시 준수:
- 챌린지영역과 난이도밴드를 벗어나지 않는다. 각 챌린지는 5~15분 내 끝나는 아주 작은 행동.
- 금지조건에 해당하는 행동(대면·전화·외출 등)은 절대 포함하지 않는다.
- 지시·명령·평가·비교·재촉 표현 금지("~해야 한다", "왜 안 했나요", "꼭·반드시·매일" 금지). 담백·따뜻하게.
- 관심사(취향)를 자연스럽게 녹인다(예: 관심=음악 → 음악과 엮은 챌린지).
- 추상적 조언("긍정적으로 생각하기") 금지. 구체적·실행가능하게.
- 출력은 JSON 배열 3개만. 다른 텍스트 없이 배열만 출력:
[{ "area": "...", "level": n, "title": "챌린지 문구", "minutes": n, "reflect_q": "완료 후 한 줄 회고 질문" }]`;

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
      challenges: pickFromBank(area, body.bandLow, body.bandHigh),
      source: "fallback",
    });

  const fewShot = Object.entries(BANK[area])
    .filter(([lv]) => Number(lv) >= body.bandLow && Number(lv) <= body.bandHigh)
    .map(([lv, items]) => `L${lv} ${items[0]!.title} (${items[0]!.minutes}분)`)
    .join(" / ");

  const userPrompt = `회복단계: ${STAGE_KO[body.stage] ?? body.stage}
챌린지영역: ${AREA_KO[area]}
난이도밴드: L${body.bandLow} ~ L${body.bandHigh}
금지조건: ${body.forbidden.length > 0 ? body.forbidden.join(", ") : "없음"}
[온보딩 정보] 수면: ${body.sleep} / 외출부담: ${body.outing} / 대인접촉부담: ${body.contact}
[오늘 설문] 컨디션: ${body.condition} / 희망영역: ${AREA_KO[area]} / 관심사: ${body.interest}
[참고 예시] ${fewShot}`;

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
      return Math.min(body.bandHigh, Math.max(body.bandLow, Math.min(5, Math.max(1, n))));
    };

    const challenges = items.slice(0, 3).map((it, idx) => {
      const title = typeof it.title === "string" ? it.title.trim() : "";
      const reflectQ =
        (typeof it.reflect_q === "string" && it.reflect_q.trim()) ||
        (typeof it.reflectQ === "string" && it.reflectQ.trim()) ||
        "오늘 해보니 어땠어요?";
      if (!title) throw new Error("missing-title");
      return {
        area,
        level: clampLevel(it.level, idx),
        title,
        minutes:
          typeof it.minutes === "number" && it.minutes > 0
            ? Math.min(30, Math.round(it.minutes))
            : 5,
        reflectQ,
      };
    });

    challenges.sort((a, b) => a.level - b.level);

    res.json({ challenges, source: "llm" });
  } catch (err) {
    req.log.warn({ err }, "challenge generation fell back to bank");
    fallback();
  }
});

export default router;
