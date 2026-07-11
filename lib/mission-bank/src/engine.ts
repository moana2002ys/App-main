import { CATEGORIES_BY_AREA, INTEREST_HINTS } from "./categories";
import type {
  Area,
  Condition,
  GeneratedMission,
  SeedCategory,
} from "./types";

const CONDITION_RANK: Record<string, number> = {
  바닥: 0,
  "그저 그럼": 1,
  괜찮음: 2,
};

function conditionRank(condition: string): number {
  return CONDITION_RANK[condition] ?? 1;
}

function clampLevel(level: number): number {
  return Math.min(5, Math.max(1, Math.round(level)));
}

// 난이도(레벨) → 대략적 소요 시간(분). 시드가 다양하므로 밴드 기준 기본값.
export function defaultMinutesForLevel(level: number): number {
  const map: Record<number, number> = { 1: 2, 2: 3, 3: 5, 4: 10, 5: 15 };
  return map[clampLevel(level)] ?? 5;
}

// 오늘 상태에서 열리는 카테고리만 후보로 남긴다.
// - 영역 일치, 밴드 범위와 레벨 겹침
// - 게이트: 금지태그가 사용자 금지조건과 겹치면 제외, 최소 컨디션 미달이면 제외
export function getEligibleCategories(params: {
  area: Area;
  bandLow: number;
  bandHigh: number;
  forbidden: string[];
  condition: string;
}): SeedCategory[] {
  const { area, forbidden, condition } = params;
  const lo = clampLevel(Math.min(params.bandLow, params.bandHigh));
  const hi = clampLevel(Math.max(params.bandLow, params.bandHigh));
  const rank = conditionRank(condition);

  const inArea = CATEGORIES_BY_AREA[area] ?? [];

  const eligible = inArea.filter((cat) => {
    // 밴드와 카테고리 난이도 범위가 겹쳐야 함
    if (cat.levels.max < lo || cat.levels.min > hi) return false;
    const gate = cat.gate;
    if (gate) {
      if (
        gate.forbiddenTags &&
        gate.forbiddenTags.some((t) => forbidden.includes(t))
      ) {
        return false;
      }
      if (gate.minCondition && rank < conditionRank(gate.minCondition)) {
        return false;
      }
    }
    return true;
  });

  if (eligible.length > 0) return eligible;

  // 안전망: 게이트로 밴드 내 후보가 전부 막혔을 때, 밴드 제약만 완화한다.
  // 게이트(금지태그·최소컨디션)는 절대 우회하지 않는다.
  return inArea.filter((cat) => {
    const gate = cat.gate;
    if (gate?.forbiddenTags?.some((t) => forbidden.includes(t))) return false;
    if (gate?.minCondition && rank < conditionRank(gate.minCondition)) {
      return false;
    }
    return true;
  });
}

// ── 한 활동 제약 가드 ──────────────────────────────────────────
// 서로 다른 두 활동을 병렬로 요구하는 미션을 감지한다.
// "좋아하는 것 3가지 찾기"처럼 한 활동을 여러 대상에 적용하는 것은 통과.
const PARALLEL_PATTERNS: RegExp[] = [
  /그리고/,
  /(^|\s)및(\s|$)/,
  /하면서/,
  /(?<![가-힣])면서/,
  /와 함께/,
  /과 함께/,
  /랑 같이/,
  /와 같이/,
  // '~하고 …' 연결형(두 활동): "정리하고 물 마시기", "산책도 하고 달리기". '하고 싶'(희망)은 제외.
  /하고\s(?!싶)/,
  // ~고 연결형(동사어간+고 뒤에 또 다른 활동): 두 활동 병렬.
  // 명사(냉장고·창고·광고 등) 오탐을 막기 위해 흔한 동사 어간만 화이트리스트로 검출한다.
  // '~고 싶'(희망 보조용언, 예: "먹고 싶은 것 검색")은 단일 활동이므로 제외.
  /(열|닫|켜|끄|씻|접|펴|걷|앉|눕|쓰|읽|듣|먹|찾|놓|넣|들|잡|깎|빗|털|썰|갈|담|두|비우|맞추|정하|고르|만들|마시|나가|다녀|눌러|채우)고\s(?!싶)/,
  // 기호 연결자: 'A + B' (두 활동을 더하는 형태)
  /[가-힣)]\s*\+\s*[가-힣]/,
  // '~ㄴ 채(로)' 동시 진행형: "음악을 틀어둔 채 걷기" (두 활동 겹침).
  // '채소' 등 명사 오탐 방지를 위해 '채' 뒤가 공백/문장끝/(로)일 때만 검출.
  /(둔|든|킨|켠|연|은|는|던|한)\s?채(로)?(\s|$)/,
  // '~ㄴ 뒤/후 …' 순차 연결형: "물을 마신 뒤 점 찍기" (두 활동 연쇄).
  // 위치 명사('책상 뒤') 오탐을 막기 위해 동사 관형형 어미 뒤 + 이어지는 활동이 있을 때만.
  /(둔|든|킨|켠|연|은|는|던|한|신)\s?(뒤|후)(에)?\s(?=[가-힣])/,
];

// 가운뎃점(·)은 대개 명사 나열(단일 활동)이지만, 'A·B하기'처럼 두 행위가 하나의
// '하기'에 직접 붙으면 두 활동이다. '중/또는/택' 같은 선택·나열 표지가 있으면 단일로 본다.
function hasDotDualAction(title: string): boolean {
  if (!/[가-힣]·[가-힣]/.test(title)) return false;
  if (/(중|또는|택)/.test(title)) return false;
  return /[가-힣]+·[가-힣]+(하기|해보기|하고|해서|하며)/.test(title);
}

export function hasParallelActivities(title: string): boolean {
  if (!title) return false;
  if (hasDotDualAction(title)) return true;
  return PARALLEL_PATTERNS.some((re) => re.test(title));
}

function pickByRotation<T>(arr: T[], offset: number): T {
  return arr[((offset % arr.length) + arr.length) % arr.length]!;
}

// 취향을 반영해 시드를 자연스럽게 변주(폴백에서도 한 활동·톤 유지).
function weaveInterest(
  seed: string,
  interest: string | undefined,
  area: Area,
): string {
  if (!interest || interest.includes("모르")) return seed;
  const hint = INTEREST_HINTS[interest]?.[area];
  if (!hint) return seed;
  // 취향·몰입/감정 계열 시드는 취향 힌트로 자연스럽게 치환한다(한 활동 유지).
  if (/좋아하는|관심 있는|기분에 맞는/.test(seed)) {
    return `${hint}`;
  }
  return seed;
}

// 폴백 미션 생성: LLM 실패/지연 시 같은 원리(카테고리 뼈대 × 변주)로 3개 생성.
// 같은 영역·난이도(낮음·중간·높음)에서 서로 다른, 한 활동·게이트 준수 미션.
export function selectFallbackMissions(params: {
  area: Area;
  bandLow: number;
  bandHigh: number;
  forbidden: string[];
  condition: string;
  interest?: string;
  rotation?: number;
}): GeneratedMission[] {
  const { area, forbidden, condition, interest } = params;
  const lo = clampLevel(Math.min(params.bandLow, params.bandHigh));
  const hi = clampLevel(Math.max(params.bandLow, params.bandHigh));
  const mid = clampLevel(Math.round((lo + hi) / 2));
  const rotation =
    params.rotation ?? Math.floor(Date.now() / (1000 * 60 * 60 * 24));

  const eligible = getEligibleCategories({
    area,
    bandLow: lo,
    bandHigh: hi,
    forbidden,
    condition,
  });

  const targetLevels = [lo, mid, hi];
  const usedTitles = new Set<string>();
  const usedCategories = new Set<string>();

  const missions = targetLevels.map((level, idx) => {
    // 해당 레벨을 담을 수 있는 카테고리 우선, 없으면 아무 적격 카테고리
    const coverCats = eligible.filter(
      (c) => c.levels.min <= level && c.levels.max >= level,
    );
    const pool = coverCats.length > 0 ? coverCats : eligible;

    // 이미 쓴 카테고리는 피해 다양성 확보
    const fresh = pool.filter((c) => !usedCategories.has(c.id));
    const cats = fresh.length > 0 ? fresh : pool;
    const cat = pickByRotation(cats, rotation + idx);
    usedCategories.add(cat.id);

    // 시드 선택: 회전 + 중복 회피
    let seed = "";
    for (let s = 0; s < cat.seeds.length; s++) {
      const candidate = weaveInterest(
        pickByRotation(cat.seeds, rotation + idx + s),
        interest,
        area,
      );
      if (!usedTitles.has(candidate) && !hasParallelActivities(candidate)) {
        seed = candidate;
        break;
      }
    }
    if (!seed) {
      seed =
        cat.seeds.find(
          (s) => !hasParallelActivities(weaveInterest(s, interest, area)),
        ) ?? cat.seeds[0]!;
    }
    usedTitles.add(seed);

    return {
      area,
      level,
      title: seed,
      minutes: defaultMinutesForLevel(level),
      reflectQ: pickByRotation(cat.reflectQs, rotation + idx),
    };
  });

  missions.sort((a, b) => a.level - b.level);
  return missions;
}

// LLM이 위반한(병렬 활동) 미션을 폴백 시드로 교체한다.
export function repairMission(
  mission: GeneratedMission,
  params: {
    area: Area;
    bandLow: number;
    bandHigh: number;
    forbidden: string[];
    condition: string;
    interest?: string;
    avoidTitles: Set<string>;
  },
): GeneratedMission {
  const eligible = getEligibleCategories({
    area: params.area,
    bandLow: params.bandLow,
    bandHigh: params.bandHigh,
    forbidden: params.forbidden,
    condition: params.condition,
  });
  const level = clampLevel(mission.level);
  const coverCats = eligible.filter(
    (c) => c.levels.min <= level && c.levels.max >= level,
  );
  const pool = coverCats.length > 0 ? coverCats : eligible;

  for (const cat of pool) {
    for (const raw of cat.seeds) {
      const candidate = weaveInterest(raw, params.interest, params.area);
      if (
        !params.avoidTitles.has(candidate) &&
        !hasParallelActivities(candidate)
      ) {
        return {
          area: params.area,
          level,
          title: candidate,
          minutes: mission.minutes || defaultMinutesForLevel(level),
          reflectQ: mission.reflectQ || cat.reflectQs[0]!,
        };
      }
    }
  }
  return mission;
}

// ── 프롬프트 헬퍼 (서버 LLM 호출용) ───────────────────────────

// 열린 카테고리를 few-shot 텍스트로. 시드는 예시일 뿐 그대로 쓰지 말라고 명시.
export function buildFewShot(params: {
  area: Area;
  bandLow: number;
  bandHigh: number;
  forbidden: string[];
  condition: string;
}): string {
  const eligible = getEligibleCategories(params);
  if (eligible.length === 0) return "(열린 카테고리 없음)";
  return eligible
    .map((cat) => {
      const gate = cat.gate?.forbiddenTags?.length
        ? ` [게이트: ${cat.gate.forbiddenTags.join("·")} 없을 때만]`
        : "";
      const seeds = cat.seeds.slice(0, 3).join(" / ");
      return `- ${cat.name} (L${cat.levels.min}~${cat.levels.max})${gate}\n  씨앗: ${seeds}\n  회고 예: ${cat.reflectQs[0]}`;
    })
    .join("\n");
}

// 취향을 각 영역에서 녹이는 법 한 줄.
export function buildInterestHint(
  interest: string | undefined,
  area: Area,
): string {
  if (!interest || interest.includes("모르")) return "특별한 취향 없음(기본 시드 사용)";
  const hint = INTEREST_HINTS[interest]?.[area];
  return hint ? `${interest} → ${hint}` : `${interest}(자연스럽게 소재로 활용)`;
}
