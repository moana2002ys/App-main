import React from 'react';
import { PhoneFrame, Mascot } from './_shared/Shared';

export function OnboardingWeek() {
  const days = [
    { day: 1, title: "물 한 잔 마시기", status: "completed", mood: "good" },
    { day: 2, title: "창문 열고 환기하기", status: "completed", mood: "okay" },
    { day: 3, title: "이부자리 정리하기", status: "completed", mood: "good" },
    { day: 4, title: "5분 동안 스트레칭", status: "today", mood: null },
    { day: 5, title: "좋아하는 노래 1곡", status: "locked", mood: null },
    { day: 6, title: "잠깐 밖으로 나가기", status: "locked", mood: null },
    { day: 7, title: "나만의 조각 완성", status: "locked", mood: null },
  ];

  return (
    <PhoneFrame>
      <div className="flex flex-col h-full bg-[#FDFBF7]">
        {/* Header */}
        <div className="px-6 pt-12 pb-6 bg-[#FDFBF7] z-10">
          <h1 className="text-[22px] font-bold text-[#4A443A] mb-2">나의 시작 데이터 쌓기</h1>
          <p className="text-[15px] text-[#898273]">7일 동안 아주 작은 조각을 모아봐요</p>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-24 relative">
          {/* Vertical line */}
          <div className="absolute left-[39px] top-6 bottom-12 w-0.5 bg-[#E5E0D8] rounded-full z-0" />

          <div className="relative z-10 flex flex-col gap-6 pt-4">
            {days.map((item, idx) => {
              const isCompleted = item.status === "completed";
              const isToday = item.status === "today";
              
              return (
                <div key={idx} className={`flex items-start gap-4 ${isToday ? 'animate-slide-up' : ''}`} style={{ animationDelay: `${idx * 0.1}s` }}>
                  {/* Node */}
                  <div className="flex-shrink-0 mt-1">
                    {isCompleted ? (
                      <div className="w-[30px] h-[30px] bg-[#A8DADC] rounded-full flex items-center justify-center shadow-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    ) : isToday ? (
                      <div className="w-[30px] h-[30px] bg-[#FFD55F] rounded-full flex items-center justify-center shadow-md animate-pulse-soft border-4 border-[#FDFBF7] ring-2 ring-[#FFD55F]">
                        <div className="w-2.5 h-2.5 bg-white rounded-full" />
                      </div>
                    ) : (
                      <div className="w-[30px] h-[30px] bg-[#E5E0D8] rounded-full flex items-center justify-center border-4 border-[#FDFBF7]">
                      </div>
                    )}
                  </div>

                  {/* Card */}
                  <div className={`flex-1 p-4 rounded-2xl transition-all ${
                    isCompleted ? 'bg-white border border-[#F5F1E6]' :
                    isToday ? 'bg-white shadow-[0_8px_30px_rgba(255,213,95,0.2)] border-2 border-[#FFD55F]' :
                    'bg-[#F5F1E6] opacity-60'
                  }`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-bold ${isToday ? 'text-[#F4A261]' : 'text-[#898273]'}`}>Day {item.day}</span>
                      {isCompleted && (
                        <span className="text-[10px] bg-[#FDFBF7] px-2 py-0.5 rounded-full text-[#898273]">
                          완료
                        </span>
                      )}
                    </div>
                    <h3 className={`font-semibold text-[15px] ${isToday ? 'text-[#4A443A]' : 'text-[#4A443A]'}`}>
                      {item.title}
                    </h3>
                    
                    {isToday && (
                      <button className="mt-3 w-full bg-[#FFD55F] text-[#4A443A] text-sm font-semibold py-2.5 rounded-xl">
                        오늘의 조각 맞추기
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Fixed bottom area with Mascot */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent pointer-events-none">
          <div className="flex items-end justify-end pointer-events-auto">
            <div className="bg-white px-4 py-3 rounded-2xl rounded-br-none shadow-md mb-2 mr-3 border border-[#F5F1E6] max-w-[200px]">
              <p className="text-sm text-[#4A443A] font-medium leading-snug">
                벌써 3개의 조각을 맞췄어요! 오늘도 응원할게요.
              </p>
            </div>
            <Mascot size={64} expression="encouraging" />
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

export default OnboardingWeek;