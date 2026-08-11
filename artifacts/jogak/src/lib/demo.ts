// 시연 모드 — 회의·발표에서만 제품 규칙의 '기다림'을 건너뛰기 위한 스위치.
//
// 켜는 법: 주소 끝에 `?demo=1` 을 붙이고 새로고침. 끄는 법: `?demo=0`.
// 한 번 켜면 localStorage에 남아 새로고침해도 유지된다.
//
// 주의: 이건 화면 노출 조건만 완화한다. 채점·게이트·금지조건은 절대 건드리지 않는다.
const KEY = "jogak_demo";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const param = new URLSearchParams(window.location.search).get("demo");
    if (param === "1") {
      window.localStorage.setItem(KEY, "1");
      return true;
    }
    if (param === "0") {
      window.localStorage.removeItem(KEY);
      return false;
    }
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
