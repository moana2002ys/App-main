import React, { useState } from 'react';
import { PhoneFrame, qpInt } from './_shared/Shared';

export function MissionProposal() {
  const [selectedMission, setSelectedMission] = useState<number>(qpInt('sel') ?? 1);
  const [difficulty, setDifficulty] = useState<string>("보통");
  const [time, setTime] = useState<string>("아침");
  const [location, setLocation] = useState<string>("내 방");

  const missions = [
    {
      id: 1,
      domain: "생활 리듬",
      title: "아침에 일어나서 이부자리 정리하기",
      badge: "내가 고른 영역",
      badgeColor: "bg-[#F5F1E6] text-[#898273]",
      diffOptions: ["가볍게", "보통", "도전"],
    },
    {
      id: 2,
      domain: "자기 돌봄",
      title: "따뜻한 차 한 잔 천천히 마시기",
      badge: "내가 고른 영역",
      badgeColor: "bg-[#F5F1E6] text-[#898273]",
      diffOptions: ["가볍게", "보통"],
    },
    {
      id: 3,
      domain: "즐거움",
      title: "좋아하는 음악 1곡 온전히 듣기",
      badge: "최근 즐거움 점수가 높았어요",
      badgeColor: "bg-[#FFF9E5] text-[#D4A017]",
      diffOptions: ["보통"],
    },
    {
      id: 4,
      domain: "작은 용기",
      title: "미뤄둔 메일함 5분만 정리하기",
      badge: "계속 미뤄왔던 조각, 더 작게 쪼갰어요",
      badgeColor: "bg-[#EBF5F5] text-[#458C8F]",
      diffOptions: ["가볍게", "보통", "도전"],
    }
  ];

  return (
    <PhoneFrame>
      <div className="flex flex-col h-full bg-[#FDFBF7]">
        {/* Header */}
        <div className="px-6 pt-10 pb-4">
          <button className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-6 text-[#4A443A]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <h1 className="text-xl font-bold text-[#4A443A] leading-snug">
            오늘 하루를 채울<br/>작은 조각을 골라주세요
          </h1>
          {/* 목업 주석: 2주차+ 유저 예시 — 첫 주는 회피 슬롯 없이 3조각 구성 */}
          <div className="mt-2 text-[10px] text-[#B8B2A3]">미리보기 기준: 함께한 지 2주차 이후 (첫 주는 3조각)</div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-32">
          <div className="flex flex-col gap-4">
            {missions.map((m) => {
              const isSelected = selectedMission === m.id;
              
              return (
                <div 
                  key={m.id}
                  onClick={() => !isSelected && setSelectedMission(m.id)}
                  className={`rounded-[24px] p-5 transition-all duration-300 ${
                    isSelected 
                      ? 'bg-white border-2 border-[#FFD55F] shadow-[0_8px_24px_rgba(255,213,95,0.15)]' 
                      : 'bg-white border border-[#E5E0D8] shadow-sm hover:border-[#FFD55F] cursor-pointer opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold text-[#F4A261] px-2 py-1 bg-[#FFF4EC] rounded-md">
                      {m.domain}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-md ${m.badgeColor}`}>
                      {m.badge}
                    </span>
                  </div>
                  
                  <h3 className="text-[16px] font-semibold text-[#4A443A] mb-4">
                    {m.title}
                  </h3>

                  {isSelected && (
                    <div className="animate-fade-in border-t border-[#F5F1E6] pt-4 mt-2 space-y-4">
                      {/* 난이도 */}
                      <div>
                        <div className="text-[12px] font-medium text-[#898273] mb-2">난이도를 조절할까요?</div>
                        <div className="flex gap-2">
                          {["가볍게", "보통", "도전"].map(diff => {
                            if (!m.diffOptions.includes(diff)) return null;
                            const diffSelected = difficulty === diff;
                            return (
                              <button
                                key={diff}
                                onClick={(e) => { e.stopPropagation(); setDifficulty(diff); }}
                                className={`flex-1 py-2 text-[13px] rounded-xl font-medium transition-colors ${
                                  diffSelected 
                                    ? 'bg-[#4A443A] text-white' 
                                    : 'bg-[#F5F1E6] text-[#898273]'
                                }`}
                              >
                                {diff}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-2 text-[10px] text-[#F4A261] flex items-center gap-1 font-medium bg-[#FFF4EC] px-2 py-1.5 rounded-md w-fit">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                          '가볍게'를 이틀 연속 잘 해내서, 이번엔 '보통'부터 추천해요
                        </div>
                      </div>

                      {/* 시간대 */}
                      <div>
                        <div className="text-[12px] font-medium text-[#898273] mb-2">오늘 언제 하실래요?</div>
                        <div className="flex gap-2">
                          {[
                            { id: "아침", icon: "🌅" },
                            { id: "점심", icon: "☀️" },
                            { id: "저녁", icon: "🌙" }
                          ].map(t => {
                            const timeSelected = time === t.id;
                            return (
                              <button
                                key={t.id}
                                onClick={(e) => { e.stopPropagation(); setTime(t.id); }}
                                className={`flex-1 py-2.5 text-[13px] rounded-xl font-medium flex justify-center items-center gap-1 transition-colors ${
                                  timeSelected 
                                    ? 'bg-[#FFF9E5] text-[#D4A017] border border-[#FFD55F]' 
                                    : 'bg-white border border-[#E5E0D8] text-[#898273]'
                                }`}
                              >
                                <span>{t.icon}</span> {t.id}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 장소 */}
                      <div>
                        <div className="text-[12px] font-medium text-[#898273] mb-2">어디서 해볼까요?</div>
                        <div className="flex gap-2">
                          {[
                            { id: "내 방", icon: "🛏️" },
                            { id: "거실", icon: "🛋️" },
                            { id: "집 밖", icon: "🌳" }
                          ].map(l => {
                            const locationSelected = location === l.id;
                            return (
                              <button
                                key={l.id}
                                onClick={(e) => { e.stopPropagation(); setLocation(l.id); }}
                                className={`flex-1 py-2.5 text-[13px] rounded-xl font-medium flex justify-center items-center gap-1 transition-colors ${
                                  locationSelected 
                                    ? 'bg-[#EBF5F5] text-[#458C8F] border border-[#A8DADC]' 
                                    : 'bg-white border border-[#E5E0D8] text-[#898273]'
                                }`}
                              >
                                <span>{l.icon}</span> {l.id}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FAB */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent pointer-events-none">
          <button className="pointer-events-auto w-full py-4 rounded-[20px] bg-[#FFD55F] text-[#4A443A] text-[16px] font-bold shadow-[0_8px_20px_rgba(255,213,95,0.3)] hover:bg-[#F2C33D] transition-colors">
            이 조각으로 결정했어요
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

export default MissionProposal;