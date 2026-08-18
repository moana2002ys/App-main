import { CATEGORIES, CATEGORIES_BY_AREA, INTEREST_HINTS } from "./categories";
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

// 카테고리 자체 게이트(금지태그·최소 컨디션)만 통과하는지 판정한다(밴드·영역 무관).
// 설문 선택지 필터링 등 밴드와 무관하게 게이트만 볼 때 재사용한다(게이트 단일 출처).
export function passesCategoryGate(
  cat: SeedCategory,
  params: { forbidden: string[]; condition: string },
): boolean {
  const gate = cat.gate;
  if (!gate) return true;
  if (gate.forbiddenTags?.some((t) => params.forbidden.includes(t))) {
    return false;
  }
  if (
    gate.minCondition &&
    conditionRank(params.condition) < conditionRank(gate.minCondition)
  ) {
    return false;
  }
  return true;
}

// 데일리 설문 2번째 질문에 노출할 활동 후보 = 카테고리 게이트를 통과하는 카테고리.
// 영역(대인/외출) 게이트는 호출부(classifier.isAreaEligible)에서 함께 적용한다.
export function getSurveyCategories(params: {
  forbidden: string[];
  condition: string;
}): SeedCategory[] {
  return CATEGORIES.filter((cat) => passesCategoryGate(cat, params));
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
  /하고,?\s(?!싶)/,
  // ~고 연결형(동사어간+고 뒤에 또 다른 활동): 두 활동 병렬.
  // 명사(냉장고·창고·광고 등) 오탐을 막기 위해 흔한 동사 어간만 화이트리스트로 검출한다.
  // '~고 싶'(희망 보조용언, 예: "먹고 싶은 것 검색")은 단일 활동이므로 제외.
  /(열|닫|켜|끄|씻|접|펴|걷|앉|눕|쓰|읽|듣|먹|찾|놓|넣|들|잡|깎|빗|털|썰|갈|담|두|적|비우|맞추|정하|고르|만들|마시|나가|다녀|눌러|채우)고,?\s(?!싶)/,
  // 기호 연결자: 'A + B' (두 활동을 더하는 형태)
  /[가-힣)]\s*\+\s*[가-힣]/,
  // '~ㄴ 채(로)' 동시 진행형: "음악을 틀어둔 채 걷기", "틀어둔 채, 스트레칭" (두 활동 겹침).
  // '채소' 등 명사 오탐 방지를 위해 '채' 뒤가 공백/쉼표/문장끝/(로)일 때만 검출.
  /(둔|든|킨|켠|연|은|는|던|한)\s?채(로)?([\s,.!?…]|$)/,
  // '~ㄴ 뒤/후 …' 순차 연결형: "물을 마신 뒤 점 찍기" (두 활동 연쇄).
  // 위치 명사('책상 뒤') 오탐을 막기 위해 동사 관형형 어미 뒤 + 이어지는 활동이 있을 때만.
  /(둔|든|킨|켠|연|은|는|던|한|신)\s?(뒤|후)(에)?,?\s(?=[가-힣])/,
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

// ── 구성 규칙 가드 (취향 2개 + 일반 1개, 사진 인증 가능 1개 이상) ──────
// 취향(관심사)별 판별 토큰. 오탐을 줄이기 위해 고정 취향 목록에 맞춘 좁은 패턴만 사용.
const INTEREST_TOKEN_PATTERNS: Record<string, RegExp> = {
  게임: /게임|길드/,
  음악: /음악|노래|플레이리스트|멜로디|곡/,
  동물: /동물|반려|강아지|고양이/,
  식물: /식물|화분|원예|식집사/,
  "요리·먹는 것": /요리|맛집|레시피|음식|먹/,
  "책·글": /책(?!상)|독서|글(?=\s|을|이|$)/,
  스포츠: /스포츠|운동|경기(?!장)/,
  "그림·만들기": /그림|그리기|그려|낙서|스케치|색칠|창작|포트폴리오/,
};

// 미션 제목이 해당 취향을 반영하는지(토큰 기반) 판별한다.
export function reflectsInterest(
  title: string,
  interest: string | undefined,
): boolean {
  if (!title || !interest || interest.includes("모르")) return false;
  const pattern = INTEREST_TOKEN_PATTERNS[interest];
  return pattern ? pattern.test(title) : false;
}

// 사진 한 장으로 결과를 남길 수 있는 활동(눈에 보이는 결과물·장면)인지 판별한다.
const PHOTO_VERIFIABLE_PATTERN =
  /적기|적어|남기|메모|쓰기|써\s?보|기록|그리기|그려|낙서|스케치|색칠|정리|치우|만들|담아|채우|이불|책상|설거지|빨래|화분|물\s?주기|요리|한\s?(컵|잔)|창밖|풍경|하늘|산책/;

export function isPhotoVerifiable(title: string): boolean {
  return PHOTO_VERIFIABLE_PATTERN.test(title);
}

// LLM/폴백 결과에 구성 규칙을 결정적으로 적용한다.
// - 취향이 있으면: 취향 반영 미션이 3개일 때 1개를 일반 시드로 교체(정확히 2개 유지),
//   1개 이하일 때 취향 힌트로 1개 승격(베스트 에포트).
// - 사진 인증 가능 미션이 없으면 1개를 사진 인증 가능한 시드로 교체.
// 교체 시 레벨·분량은 유지하고, 한 활동 가드를 통과하는 시드만 쓴다.
export function enforceComposition(
  missions: GeneratedMission[],
  params: {
    area: Area;
    bandLow: number;
    bandHigh: number;
    forbidden: string[];
    condition: string;
    interest?: string;
  },
): GeneratedMission[] {
  const { interest } = params;
  const hasInterest =
    !!interest &&
    !interest.includes("모르") &&
    !!INTEREST_TOKEN_PATTERNS[interest];
  const result = missions.map((m) => ({ ...m }));
  const avoid = new Set(result.map((m) => m.title));
  const eligible = getEligibleCategories(params);

  const isInterest = (t: string) => hasInterest && reflectsInterest(t, interest);

  const findSeed = (
    level: number,
    pred: (seed: string) => boolean,
  ): { seed: string; cat: SeedCategory } | null => {
    const cover = eligible.filter(
      (c) => c.levels.min <= level && c.levels.max >= level,
    );
    // 레벨을 덮는 카테고리 우선, 없으면 전체 적격 카테고리까지 넓혀 찾는다.
    // 카테고리 안에서는 요청 레벨에 가까운 태그의 시드부터 시도한다(강도 정합).
    for (const pool of cover.length > 0 ? [cover, eligible] : [eligible]) {
      for (const cat of pool) {
        const dist = (i: number) => {
          const tagged = cat.seedLevels?.[i];
          return tagged !== undefined ? Math.abs(tagged - level) : 0.75;
        };
        const idxs = cat.seeds
          .map((_, i) => i)
          .sort((a, b) => dist(a) - dist(b));
        for (const i of idxs) {
          const seed = cat.seeds[i]!;
          if (avoid.has(seed)) continue;
          if (hasParallelActivities(seed)) continue;
          if (!pred(seed)) continue;
          return { seed, cat };
        }
      }
    }
    return null;
  };

  const replaceAt = (
    idx: number,
    found: { seed: string; cat: SeedCategory },
  ) => {
    avoid.add(found.seed);
    result[idx] = {
      ...result[idx]!,
      title: found.seed,
      reflectQ: found.cat.reflectQs[0] ?? result[idx]!.reflectQ,
      categoryId: found.cat.id,
    };
  };

  if (hasInterest) {
    const interestIdxs = result
      .map((m, i) => (isInterest(m.title) ? i : -1))
      .filter((i) => i >= 0);

    if (interestIdxs.length === 3) {
      // 3개 모두 취향 반영 → 1개를 일반으로. 사진 규칙이 깨지지 않을 슬롯을 고른다.
      let replaceIdx = interestIdxs[interestIdxs.length - 1]!;
      for (const i of interestIdxs) {
        const othersHavePhoto = result.some(
          (m, j) => j !== i && isPhotoVerifiable(m.title),
        );
        if (othersHavePhoto || !isPhotoVerifiable(result[i]!.title)) {
          replaceIdx = i;
          break;
        }
      }
      const level = result[replaceIdx]!.level;
      const found =
        findSeed(level, (s) => !isInterest(s) && isPhotoVerifiable(s)) ??
        findSeed(level, (s) => !isInterest(s));
      if (found) replaceAt(replaceIdx, found);
    } else if (interestIdxs.length < 2) {
      // 취향 반영이 부족 → 취향 미션 후보(영역 힌트 → 범용 문구 순)로 일반 슬롯을 2개가 될 때까지 승격.
      const candidates = [
        INTEREST_HINTS[interest]?.[params.area],
        `좋아하는 ${interest} 떠올려 한 줄 적기`,
      ].filter(
        (t): t is string =>
          !!t && !avoid.has(t) && !hasParallelActivities(t) && isInterest(t),
      );
      let need = 2 - interestIdxs.length;
      for (const candidate of candidates) {
        if (need <= 0) break;
        const genericIdxs = result
          .map((m, i) => (isInterest(m.title) ? -1 : i))
          .filter((i) => i >= 0);
        if (genericIdxs.length <= 1) break; // 일반 슬롯 1개는 남긴다.
        // 유일한 사진 인증 가능 슬롯은 피한다(후보가 사진 인증 가능하면 무관).
        const safeIdx = genericIdxs.find(
          (i) =>
            isPhotoVerifiable(candidate) ||
            !isPhotoVerifiable(result[i]!.title) ||
            result.some((m, j) => j !== i && isPhotoVerifiable(m.title)),
        );
        if (safeIdx !== undefined) {
          avoid.add(candidate);
          result[safeIdx] = { ...result[safeIdx]!, title: candidate };
          need -= 1;
        }
      }
    }
  }

  if (!result.some((m) => isPhotoVerifiable(m.title))) {
    // 사진 인증 가능 미션이 없음 → 일반 슬롯 우선으로 1개 교체(취향 2개 유지).
    const genericIdxs = result
      .map((m, i) => (isInterest(m.title) ? -1 : i))
      .filter((i) => i >= 0);
    const idx =
      genericIdxs.length > 0 ? genericIdxs[genericIdxs.length - 1]! : result.length - 1;
    const wantInterest = isInterest(result[idx]!.title);
    const found =
      findSeed(
        result[idx]!.level,
        (s) => isPhotoVerifiable(s) && isInterest(s) === wantInterest,
      ) ??
      findSeed(result[idx]!.level, (s) => isPhotoVerifiable(s) && !isInterest(s));
    if (found) replaceAt(idx, found);
  }

  return result;
}

function pickByRotation<T>(arr: T[], offset: number): T {
  return arr[((offset % arr.length) + arr.length) % arr.length]!;
}

// 카테고리 안에서 목표 레벨에 가장 가까운 시드를 고른다(동률은 회전으로 변주).
// 사용 불가(중복·병렬활동) 시드는 제외. 후보가 전혀 없으면 null.
function pickSeedNearLevel(
  cat: SeedCategory,
  level: number,
  interest: string | undefined,
  rotation: number,
  usedTitles: Set<string>,
): string | null {
  const cands: { text: string; dist: number }[] = [];
  cat.seeds.forEach((raw, i) => {
    const text = weaveInterest(raw, interest, cat.area);
    if (usedTitles.has(text) || hasParallelActivities(text)) return;
    const tagged = cat.seedLevels?.[i];
    cands.push({
      text,
      dist: tagged !== undefined ? Math.abs(tagged - level) : 0.75,
    });
  });
  if (cands.length === 0) return null;
  const minDist = Math.min(...cands.map((c) => c.dist));
  const best = cands.filter((c) => c.dist === minDist);
  return pickByRotation(best, rotation).text;
}

// 강도 토글용: 같은 카테고리 안에서 요청 레벨(effectiveLevel)에 맞는 미션을 다시 뽑는다.
// 핵심 포인트(카테고리)는 유지하고 강도만 진짜로 바꾼다 — 문구·분량까지 함께.
// 게이트는 계획 시점에 이미 통과한 카테고리만 호출되므로 재검사하지 않는다.
// 요청 레벨에 맞는 "다른" 시드가 없으면 null(호출부는 원래 문구 유지).
export function reselectMissionAtLevel(params: {
  categoryId: string;
  level: number;
  interest?: string;
  avoidTitles?: string[];
  rotation?: number;
}): GeneratedMission | null {
  const cat = CATEGORIES.find((c) => c.id === params.categoryId);
  if (!cat) return null;
  const level = clampLevel(params.level);
  const rotation = params.rotation ?? 0;
  const used = new Set(params.avoidTitles ?? []);
  const seed = pickSeedNearLevel(cat, level, params.interest, rotation, used);
  if (!seed) return null;
  return {
    area: cat.area,
    level,
    title: seed,
    minutes: defaultMinutesForLevel(level),
    reflectQ: pickByRotation(cat.reflectQs, rotation),
    categoryId: cat.id,
  };
}

// 밴드[lo..hi]를 count개의 난이도로 고르게 편다.
// count=1 → [mid], count=2 → [lo, hi], count=3 → [lo, mid, hi] …
function spreadLevels(lo: number, hi: number, count: number): number[] {
  const l = clampLevel(Math.min(lo, hi));
  const h = clampLevel(Math.max(lo, hi));
  if (count <= 1) return [clampLevel(Math.round((l + h) / 2))];
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    out.push(clampLevel(Math.round(l + t * (h - l))));
  }
  return out;
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

// 한 영역에서 count개의 미션을 뽑는다(카테고리 뼈대 × 변주).
// 밴드 안에서 서로 다른 난이도로 펴고, 한 활동·게이트·중복회피 규칙을 지킨다.
// avoidTitles/usedCategories를 넘기면 여러 영역에 걸쳐 중복을 함께 방지한다.
export function selectAreaMissions(params: {
  area: Area;
  bandLow: number;
  bandHigh: number;
  forbidden: string[];
  condition: string;
  interest?: string;
  rotation?: number;
  count?: number;
  avoidTitles?: Set<string>;
  usedCategories?: Set<string>;
  // 사용자가 오늘 설문에서 고른 활동의 카테고리 id. 이 영역에서 우선 배정한다.
  preferredCategoryId?: string;
}): GeneratedMission[] {
  const { area, forbidden, condition, interest } = params;
  const lo = clampLevel(Math.min(params.bandLow, params.bandHigh));
  const hi = clampLevel(Math.max(params.bandLow, params.bandHigh));
  const count = params.count ?? 3;
  const rotation =
    params.rotation ?? Math.floor(Date.now() / (1000 * 60 * 60 * 24));

  const eligible = getEligibleCategories({
    area,
    bandLow: lo,
    bandHigh: hi,
    forbidden,
    condition,
  });
  if (eligible.length === 0) return [];

  const preferredCat = params.preferredCategoryId
    ? eligible.find((c) => c.id === params.preferredCategoryId)
    : undefined;

  const targetLevels = spreadLevels(lo, hi, count);
  const usedTitles = params.avoidTitles ?? new Set<string>();
  const usedCategories = params.usedCategories ?? new Set<string>();

  const missions: GeneratedMission[] = [];
  targetLevels.forEach((level, idx) => {
    // 해당 레벨을 담을 수 있는 카테고리 우선, 없으면 아무 적격 카테고리
    const coverCats = eligible.filter(
      (c) => c.levels.min <= level && c.levels.max >= level,
    );
    const pool = coverCats.length > 0 ? coverCats : eligible;

    // 이미 쓴 카테고리는 피해 다양성 확보
    const fresh = pool.filter((c) => !usedCategories.has(c.id));
    const cats = fresh.length > 0 ? fresh : pool;
    // 선택 활동 카테고리는 담을 수 있는 첫 레벨 슬롯에 우선 배정한다.
    const cat =
      preferredCat &&
      !usedCategories.has(preferredCat.id) &&
      cats.some((c) => c.id === preferredCat.id)
        ? preferredCat
        : pickByRotation(cats, rotation + idx);
    usedCategories.add(cat.id);

    // 시드 선택: 목표 레벨에 가장 가까운 태그의 시드 우선(동률은 회전), 중복 회피.
    // seedLevels가 없는 시드는 거리 0.75로 취급(태그된 근접 시드가 있으면 그쪽 우선).
    const seed =
      pickSeedNearLevel(cat, level, interest, rotation + idx, usedTitles) ??
      (() => {
        const woven = cat.seeds.map((s) => weaveInterest(s, interest, area));
        return (
          woven.find((s) => !usedTitles.has(s) && !hasParallelActivities(s)) ??
          woven.find((s) => !hasParallelActivities(s)) ??
          woven[0]!
        );
      })();
    usedTitles.add(seed);

    missions.push({
      area,
      level,
      title: seed,
      minutes: defaultMinutesForLevel(level),
      reflectQ: pickByRotation(cat.reflectQs, rotation + idx),
      categoryId: cat.id,
    });
  });

  missions.sort((a, b) => a.level - b.level);
  // 구성 규칙(취향 2+일반 1, 사진 인증 가능 1+)을 폴백에도 동일 적용.
  return enforceComposition(missions, {
    area,
    bandLow: lo,
    bandHigh: hi,
    forbidden,
    condition,
    interest,
  });
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
  return selectAreaMissions({ ...params, count: 3 });
}

// 영역 + 그 영역의 (게이트·컨디션 반영) 난이도 밴드.
export interface AreaBand {
  area: Area;
  bandLow: number;
  bandHigh: number;
}

// 하루 4개 폴백 구성: 선택 영역 2개 + 다양성 후보 영역 2개.
// - 다양성 후보가 2개 이상: 서로 다른 두 영역에서 1개씩.
// - 다양성 후보가 1개: 그 영역에서 서로 다른 2개.
// - 다양성 후보가 0개: 선택 영역으로 2개를 더 채운다(빈 카드 없음).
// 부족분이 생기면 선택 영역에서 우아하게 보충한다. 제목 중복은 전역으로 방지.
export function selectDiverseFallbackMissions(params: {
  selected: AreaBand;
  diversity: AreaBand[];
  forbidden: string[];
  condition: string;
  interest?: string;
  rotation?: number;
  // 선택 영역에서 우선 배정할 활동 카테고리 id(설문 선택 활동).
  preferredCategoryId?: string;
}): GeneratedMission[] {
  const rotation =
    params.rotation ?? Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const { forbidden, condition, interest } = params;
  const usedTitles = new Set<string>();

  const selectedMissions = selectAreaMissions({
    area: params.selected.area,
    bandLow: params.selected.bandLow,
    bandHigh: params.selected.bandHigh,
    forbidden,
    condition,
    interest,
    rotation,
    count: 2,
    avoidTitles: usedTitles,
    preferredCategoryId: params.preferredCategoryId,
  });

  const diversityMissions: GeneratedMission[] = [];
  const cands = params.diversity;
  const pickFromArea = (band: AreaBand, count: number, seedOffset: number) =>
    selectAreaMissions({
      area: band.area,
      bandLow: band.bandLow,
      bandHigh: band.bandHigh,
      forbidden,
      condition,
      interest,
      rotation: rotation + seedOffset,
      count,
      avoidTitles: usedTitles,
    });

  if (cands.length >= 2) {
    const n = cands.length;
    const i1 = ((rotation % n) + n) % n;
    const i2 = (i1 + 1) % n;
    diversityMissions.push(...pickFromArea(cands[i1]!, 1, 0));
    diversityMissions.push(...pickFromArea(cands[i2]!, 1, 1));
  } else if (cands.length === 1) {
    diversityMissions.push(...pickFromArea(cands[0]!, 2, 0));
  }
  // cands.length === 0 → 아래 보충 로직이 선택 영역으로 채운다.

  let all = [...selectedMissions, ...diversityMissions];

  // 부족분(게이트로 후보가 막혔거나 시드 부족)은 선택 영역에서 우아하게 채운다.
  if (all.length < 4) {
    const filler = selectAreaMissions({
      area: params.selected.area,
      bandLow: params.selected.bandLow,
      bandHigh: params.selected.bandHigh,
      forbidden,
      condition,
      interest,
      rotation: rotation + 7,
      count: 4 - all.length,
      avoidTitles: usedTitles,
    });
    all = [...all, ...filler];
  }

  return all.slice(0, 4);
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
          categoryId: cat.id,
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
