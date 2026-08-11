// 실제 달력 날짜 유틸 — "개인마다 다른 온보딩 날짜"의 기반.
//
// 원칙: 앱 전체가 이미 `dayCount`(1부터 세는 순번)로 돌아간다. 그걸 갈아엎지 않고
// **가입일(startedAt) + 오늘 날짜**에서 dayCount를 파생시킨다. 따라서 A가 8/10에,
// B가 8/5에 가입했으면 같은 날 앱을 열어도 A는 Day1, B는 Day6을 본다.
//
// 시간대: 사용자의 로컬 자정을 하루 경계로 본다(UTC 아님). 새벽 활동이 많은
// 대상자 특성상 자정 경계가 가혹할 수 있으나, 경계 보정(예: 새벽 4시)은
// 사이클·보상 전반에 영향을 주므로 팀 합의 후 `DAY_ROLLOVER_HOUR`로 조정한다.
export const DAY_ROLLOVER_HOUR = 0;

/** 'YYYY-MM-DD' 형식의 날짜 키. 로컬 타임존 기준. */
export type DateKey = string;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 롤오버 시각을 반영한 '오늘'. DAY_ROLLOVER_HOUR=4면 새벽 3시는 아직 어제다. */
export function todayKey(now: Date = new Date()): DateKey {
  const d = new Date(now);
  d.setHours(d.getHours() - DAY_ROLLOVER_HOUR);
  return toKey(d);
}

export function parseKey(key: DateKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(key: DateKey, n: number): DateKey {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** a - b (일수). 같은 날이면 0, a가 하루 뒤면 1. */
export function diffDays(a: DateKey, b: DateKey): number {
  const ms = parseKey(a).getTime() - parseKey(b).getTime();
  return Math.round(ms / 86400000);
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function weekdayKo(key: DateKey): string {
  return WEEKDAY_KO[parseKey(key).getDay()] ?? "";
}

/** "8월 10일 (일)" */
export function formatKorean(key: DateKey): string {
  const d = parseKey(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdayKo(key)})`;
}

/** "오늘" / "어제" / "8월 10일 (일)" */
export function formatRelative(key: DateKey, today: DateKey = todayKey()): string {
  const diff = diffDays(key, today);
  if (diff === 0) return "오늘";
  if (diff === -1) return "어제";
  if (diff === 1) return "내일";
  return formatKorean(key);
}
