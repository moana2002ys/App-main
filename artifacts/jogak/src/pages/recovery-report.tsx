import React from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { MascotBadge } from "@/components/MascotBadge";

export function RecoveryReport() {
  const { user, setView } = useAppStore();

  const totalSteps = user?.dayRecords?.length || 0;
  const totalShards = user?.dayRecords?.reduce((acc, r) => acc + (r.completedTarget ? 2 : 1), 0) || 0;
  const totalRest = user?.dayRecords?.filter(r => r.mood === 1).length || 0;

  // SDT 자율성 레벨 (A0 ~ A4)
  let levelBadge = "A1 단계";
  let levelName = "A1: 첫걸음 선택 단계";
  let levelDesc = "제시된 미션 중 원하는 시간대와 미션을 직접 조정하는 연습 단계입니다.";

  if (totalSteps >= 19) {
    levelBadge = "A4 단계";
    levelName = "A4: 주간 자율 계획 단계";
    levelDesc = "스스로 주간 계획과 자신만의 행동 미션을 전적으로 수립하는 완성 단계입니다.";
  } else if (totalSteps >= 13) {
    levelBadge = "A3 단계";
    levelName = "A3: 자율 탐색 및 직접 제안 단계";
    levelDesc = "시스템 제안을 벗어나 나에게 필요한 행동을 자유롭게 입력하고 시도하는 단계입니다.";
  } else if (totalSteps >= 8) {
    levelBadge = "A2 단계";
    levelName = "A2: 보폭 확장 & 영역 탐색 단계";
    levelDesc = "방 안에서 집 안(거실), 집 전체(My Home), 동네로 활동 영역을 따뜻하게 넓혀가는 단계입니다.";
  } else if (totalSteps >= 4) {
    levelBadge = "A1 단계";
    levelName = "A1: 첫걸음 선택 단계";
    levelDesc = "제시된 미션 중 원하는 시간대와 미션을 직접 조정하는 연습 단계입니다.";
  } else {
    levelBadge = "A0 단계";
    levelName = "A0: 왕초보 수락 단계";
    levelDesc = "준비된 1~3개 미션을 수락하거나 쉬어가는 기초 적응 단계입니다.";
  }

  return (
    <div className="flex flex-col h-full bg-[#F6F1E8] p-4 overflow-y-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => setView("growth")}>
          ← 돌아가기
        </Button>
        <MascotBadge />
      </div>

      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#2B2724]">스텝바이스탭 회복 리포트</h1>
        <p className="text-xs text-[#6F6660]">SDT(자기결정이론) 기반 자율성 성장 곡선 및 회복 스탯</p>
      </div>

      {/* 자율성 레벨 카드 */}
      <div className="bg-white rounded-xl p-4 border border-[#E7DDCE] mb-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-[#2B2724]">내 자율성 단계 (SDT 기반)</span>
          <span className="text-xs font-bold text-white bg-[#4A7C59] px-2.5 py-0.5 rounded-full">
            {levelBadge}
          </span>
        </div>
        <div className="bg-[#F6F1E8] rounded-lg p-3">
          <div className="text-sm font-bold text-[#2B2724] mb-1">{levelName}</div>
          <p className="text-xs text-[#6F6660] leading-relaxed">{levelDesc}</p>
        </div>
      </div>

      {/* 누적 회복 지표 스탯 */}
      <div className="bg-white rounded-xl p-4 border border-[#E7DDCE] mb-4 shadow-sm">
        <span className="text-sm font-bold text-[#2B2724] block mb-3">누적 일상 회복 스탯</span>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#F6F1E8] rounded-lg p-3 text-center">
            <div className="text-xl font-extrabold text-[#E9A63C]">{totalSteps}</div>
            <div className="text-[11px] text-[#6F6660] mt-0.5">시도한 행동</div>
          </div>
          <div className="bg-[#F6F1E8] rounded-lg p-3 text-center">
            <div className="text-xl font-extrabold text-[#E9A63C]">{totalShards}</div>
            <div className="text-[11px] text-[#6F6660] mt-0.5">밝힌 빛조각</div>
          </div>
          <div className="bg-[#F6F1E8] rounded-lg p-3 text-center">
            <div className="text-xl font-extrabold text-[#E9A63C]">{totalRest}</div>
            <div className="text-[11px] text-[#6F6660] mt-0.5">쉬어가기 (쉼터)</div>
          </div>
          <div className="bg-[#F6F1E8] rounded-lg p-3 text-center">
            <div className="text-xl font-extrabold text-[#E9A63C]">{Math.floor(totalSteps * 0.6)}</div>
            <div className="text-[11px] text-[#6F6660] mt-0.5">남긴 장면 조각</div>
          </div>
        </div>
      </div>

      {/* 기관 컨택 피치 스마트 카드 */}
      <div className="bg-[#FAF4E8] rounded-xl p-4 border border-[#E9A63C] shadow-sm">
        <span className="text-[10px] font-bold text-[#A36B15] bg-[#FBE5C3] px-2 py-0.5 rounded mb-2 inline-block">
          서울 기지개 센터 · 안 무서운 회사 제안 포인트
        </span>
        <h4 className="text-sm font-bold text-[#2B2724] mb-2">왜 '스텝바이스탭'인가요?</h4>
        <ul className="text-xs text-[#6F6660] space-y-1.5 list-disc pl-4 leading-relaxed">
          <li><strong>강요 없는 선택적 사진 UX:</strong> 은둔 청년에게 감시 부담이 아닌 픽셀 조각 보상 재료로 역발상 전환</li>
          <li><strong>100% 프라이버시 안심 지대:</strong> 데이터 서버 전송 없이 기기 내부 보관 & EXIF 자동 삭제</li>
          <li><strong>행동 활성화 (BA) & SDT 로직:</strong> A0(왕초보)부터 A4(자율 계획)까지 스스로 전진하는 구조화된 여정</li>
        </ul>
      </div>
    </div>
  );
}
