// 임시 검증 스크립트 — 설문 채점 로직 단위 검증 (실행: pnpm --filter @workspace/jogak exec tsx scripts/verify-survey-scoring.ts)
import { getFirstLaunchItems, getChapters, getReverseItems, getScaleMax } from "../src/lib/survey";
import {
  isSecluded, outingBurdenFromScQ1, severitySum, severityBand, bandFromSeverity,
  computeAreaSeeds, scoreFirstLaunch, scoreKnowYourself, finalStageFrom, deriveLegacyAnswers,
} from "../src/lib/survey-scoring";

let fails = 0;
function eq(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log(`FAIL ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${name}`);
}

const items = getFirstLaunchItems();
eq("first launch item count", items.length, 17);
eq("first item ids", [items[0].id, items[1].id, items[2].id, items[16].id], ["sc_q1","sc_q2","ss1","ss15"]);

// 은둔 판정
eq("secluded q1=1 q2=3", isSecluded({sc_q1:1, sc_q2:3}), true);
eq("secluded q1=4 q2=6", isSecluded({sc_q1:4, sc_q2:6}), true);
eq("not secluded q1=5", isSecluded({sc_q1:5, sc_q2:3}), false);
eq("not secluded q2=4(질병)", isSecluded({sc_q1:2, sc_q2:4}), false);
eq("not secluded q2=5(임신출산)", isSecluded({sc_q1:2, sc_q2:5}), false);

// 외출부담
eq("burden 1→상", outingBurdenFromScQ1(1), "상");
eq("burden 2→상", outingBurdenFromScQ1(2), "상");
eq("burden 3→중", outingBurdenFromScQ1(3), "중");
eq("burden 4→중", outingBurdenFromScQ1(4), "중");
eq("burden 5→하", outingBurdenFromScQ1(5), "하");
eq("burden 8→하", outingBurdenFromScQ1(8), "하");

// 심각도
const all3: Record<string, number> = {}; for (let i=1;i<=15;i++) all3[`ss${i}`]=3;
eq("severity max", severitySum(all3), 45);
eq("band 10→낮음", severityBand(10), "낮음");
eq("band 11→중간", severityBand(11), "중간");
eq("band 25→중간", severityBand(25), "중간");
eq("band 26→높음", severityBand(26), "높음");
eq("band 낮음→L3~4", bandFromSeverity("낮음"), {low:3,high:4});
eq("band 중간→L2", bandFromSeverity("중간"), {low:2,high:2});
eq("band 높음→L1", bandFromSeverity("높음"), {low:1,high:1});

// 영역 시드 예시(JSON 명세): ss5 응답 3 → 은둔심각도 +3.0, 관계 +1.5, 생활리듬 +3.0(가중치 1.0)
const seeds = computeAreaSeeds(items, { ss5: 3 });
eq("seed ss5=3 은둔심각도", seeds["은둔심각도"], 3);
eq("seed ss5=3 관계", seeds["관계"], 1.5);
eq("seed ss5=3 생활리듬", seeds["생활리듬"], 3);

// 첫 실행 종합: 은둔 + 높은 심각도
const r1 = scoreFirstLaunch(items, { sc_q1:1, sc_q2:3, ...all3 });
eq("r1 stage secluded", r1.stage, "secluded");
eq("r1 band L1", [r1.baseBandLow, r1.baseBandHigh], [1,1]);
eq("r1 forbidden has 외출·관계대면", ["외출","대면","전화","관계대면"].every(f=>r1.forbidden.includes(f)), true);

// 비은둔 + 낮은 심각도 → 비위험군 L3~4
const r2 = scoreFirstLaunch(items, { sc_q1:8, sc_q2:6 });
eq("r2 stage not_at_risk", r2.stage, "not_at_risk");
eq("r2 band L3~4", [r2.baseBandLow, r2.baseBandHigh], [3,4]);
eq("r2 forbidden empty", r2.forbidden, []);

// 비은둔 + 중간 심각도 → at_risk L2
const mid: Record<string, number> = { sc_q1:6, sc_q2:6 }; for (let i=1;i<=15;i++) mid[`ss${i}`]=1; // Σ=15
const r3 = scoreFirstLaunch(items, mid);
eq("r3 stage at_risk", r3.stage, "at_risk");
eq("r3 band L2", [r3.baseBandLow, r3.baseBandHigh], [2,2]);

// 레거시 파생
const legacy = deriveLegacyAnswers({ ss1:3, ss10:3 }, r1);
eq("legacy sleep 밤낮 바뀜", legacy.sleep, "밤낮 바뀜");
eq("legacy outing 매우 부담", legacy.outing, "매우 부담");
eq("legacy contact 혼자가 편함", legacy.contact, "혼자가 편함");

// 나 알아가기: 챕터·역코딩 구조
const chapters = getChapters();
eq("chapter count", chapters.length, 5);
eq("total k items", chapters.reduce((n,c)=>n+c.items.length,0), 25);
eq("reverse items", getReverseItems().size, 17);
eq("scale max likert5", getScaleMax("likert5"), 4);

// 전 문항 응답 0(역문항은 4점) : raw = 17*4 = 68 → 고위험군
const allZero: Record<string, number> = {}; chapters.forEach(c=>c.items.forEach(i=>allZero[i.id]=0));
const s1 = scoreKnowYourself(allZero);
eq("s1 answered 25", s1.answeredCount, 25);
eq("s1 raw 68", s1.rawTotal, 68);
eq("s1 scaled 68", s1.scaled100, 68);
eq("s1 level 고위험군", s1.isolationLevel, "고위험군");
eq("s1 final stage", finalStageFrom(false, s1), "highly_isolated");
eq("s1 은둔 우선", finalStageFrom(true, s1), "secluded");

// 전 문항 최고 긍정(역문항 4, 정문항 0) → raw 0 → 비위험군
const best: Record<string, number> = {}; const rev = getReverseItems();
chapters.forEach(c=>c.items.forEach(i=>best[i.id]= rev.has(i.id) ? 4 : 0));
const s2 = scoreKnowYourself(best);
eq("s2 raw 0", s2.rawTotal, 0);
eq("s2 비위험군", s2.isolationLevel, "비위험군");
eq("s2 final not_at_risk", finalStageFrom(false, s2), "not_at_risk");

// 분기 스킵(ch2 5문항 + ch4 4문항 미응답) → 비례 환산 검증
const skipped: Record<string, number> = {};
chapters.forEach(c=>{ if(c.id==="ch2"||c.id==="ch4") return; c.items.forEach(i=>skipped[i.id]=2); });
const s3 = scoreKnowYourself(skipped);
eq("s3 answered 16", s3.answeredCount, 16);
eq("s3 max 64", s3.maxPossible, 64);
eq("s3 scaled 50", s3.scaled100, 50);
eq("s3 위험군", s3.isolationLevel, "위험군");
eq("s3 final at_risk", finalStageFrom(false, s3), "at_risk");

eq("무응답 → 비위험군(0점)", scoreKnowYourself({}).isolationLevel, "비위험군");
console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
