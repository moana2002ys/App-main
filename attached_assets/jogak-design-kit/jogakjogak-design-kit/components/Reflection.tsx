import React, { useState } from 'react';
import { PhoneFrame, Mascot, qp, qpInt } from './_shared/Shared';

const SKIP_REASONS = ["너무 피곤했어요", "잊어버렸어요", "시간이 부족했어요", "다른 일이 생겼어요", "그냥 하기 싫었어요"];

export function Reflection() {
  // v2 결정: 초기값 없음 — 터치 전에는 핸들·수치 미표시(무성의 응답의 밴드 오염 방지)
  const [pleasure, setPleasure] = useState<number | null>(qpInt('p'));
  const [mastery, setMastery] = useState<number | null>(qpInt('m'));
  const [skipped, setSkipped] = useState(qp('skipped') === '1');
  const [skipReason, setSkipReason] = useState<string | null>(() => {
    const i = qpInt('reason');
    return i === null ? null : SKIP_REASONS[i] ?? null;
  });

  return (
    <PhoneFrame>
      <div className="flex flex-col h-full bg-[#FDFBF7]">
        {/* Header */}
        <div className="px-6 pt-12 pb-2 text-center animate-slide-up">
          <div className="flex justify-center mb-4">
            <Mascot size={80} expression="happy" />
          </div>
          <h1 className="text-[22px] font-bold text-[#4A443A] mb-1">
            작은 조각을 맞췄어요!
          </h1>
          <p className="text-[14px] text-[#898273]">
            아침에 일어나서 이부자리 정리하기
          </p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-24 space-y-8 mt-6">
          
          {!skipped ? (
            <>
              {/* Sliders */}
              <div className="space-y-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#F5F1E6]">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h3 className="font-semibold text-[#4A443A] flex items-center gap-2">
                        <span className="text-xl">😊</span> 즐거움
                      </h3>
                      <p className="text-[11px] text-[#898273] mt-1">이 활동을 하며 얼마나 즐거웠나요?</p>
                    </div>
                    <span className="text-xl font-bold text-[#F4A261]">{pleasure ?? '–'}</span>
                  </div>
                  <input 
                    type="range" min="0" max="10" 
                    value={pleasure ?? 5} onChange={(e) => setPleasure(Number(e.target.value))}
                    className={`w-full h-2 bg-[#F5F1E6] rounded-lg appearance-none cursor-pointer accent-[#F4A261] ${pleasure === null ? 'opacity-40' : ''}`}
                  />
                  <div className="flex justify-between text-[10px] text-[#898273] mt-2 font-medium">
                    <span>전혀</span>
                    <span>매우</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#F5F1E6]">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h3 className="font-semibold text-[#4A443A] flex items-center gap-2">
                        <span className="text-xl">💪</span> 뿌듯함
                      </h3>
                      <p className="text-[11px] text-[#898273] mt-1">해냈다는 성취감이 들었나요?</p>
                    </div>
                    <span className="text-xl font-bold text-[#A8DADC]">{mastery ?? '–'}</span>
                  </div>
                  <input 
                    type="range" min="0" max="10" 
                    value={mastery ?? 5} onChange={(e) => setMastery(Number(e.target.value))}
                    className={`w-full h-2 bg-[#F5F1E6] rounded-lg appearance-none cursor-pointer accent-[#A8DADC] ${mastery === null ? 'opacity-40' : ''}`}
                  />
                  <div className="flex justify-between text-[10px] text-[#898273] mt-2 font-medium">
                    <span>전혀</span>
                    <span>매우</span>
                  </div>
                </div>
              </div>

              {/* Micro Feedback Card */}
              <div className="bg-[#FFF9E5] p-4 rounded-[20px] flex items-center gap-4 shadow-sm border border-[#FFD55F] animate-fade-in" style={{ animationDelay: '0.25s' }}>
                <div className="flex-shrink-0 bg-white rounded-full p-2 shadow-sm border border-[#F5F1E6]">
                  <Mascot size={32} expression="happy" />
                </div>
                <p className="text-[13px] font-medium text-[#4A443A] leading-snug">
                  이번 주, 조각을 맞춘 날<br/>기분이 평균 <span className="text-[#D4A017] font-bold">한 칸 높았어요!</span>
                </p>
              </div>

              {/* Text / Photo (Optional) */}
              <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-[14px] font-semibold text-[#4A443A] mb-3 ml-2">기억하고 싶은 순간 (선택)</h3>
                <textarea 
                  placeholder="오늘 활동에서 느낀 점을 짧게 남겨보세요."
                  className="w-full bg-white border border-[#E5E0D8] rounded-[20px] p-4 text-[14px] text-[#4A443A] placeholder:text-[#898273] h-24 resize-none focus:outline-none focus:border-[#FFD55F] transition-colors"
                />
                
                <button className="mt-3 flex items-center justify-center gap-2 w-full py-3.5 bg-white border border-[#E5E0D8] rounded-[20px] text-[14px] font-medium text-[#898273]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  사진 첨부하기
                </button>
              </div>

              <div className="text-center mt-6">
                <button 
                  onClick={() => setSkipped(true)}
                  className="text-[13px] text-[#898273] underline underline-offset-4"
                >
                  혹시 조각을 건너뛰었나요?
                </button>
              </div>
            </>
          ) : (
            <div className="animate-fade-in bg-white p-6 rounded-[24px] border border-[#F5F1E6]">
              <h3 className="font-semibold text-[#4A443A] mb-2">괜찮아요, 그럴 수 있어요.</h3>
              <p className="text-[13px] text-[#898273] mb-6">다음에 더 잘게 쪼개서 시작해볼까요? 어떤 게 발목을 잡았는지 알려주세요.</p>
              
              <div className="flex flex-wrap gap-2">
                {SKIP_REASONS.map(reason => (
                  <button 
                    key={reason}
                    onClick={() => setSkipReason(reason)}
                    className={`px-4 py-2.5 rounded-full text-[13px] font-medium transition-colors ${
                      skipReason === reason ? 'bg-[#4A443A] text-white' : 'bg-[#F5F1E6] text-[#898273]'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setSkipped(false)}
                className="mt-8 text-[12px] text-[#898273] flex items-center gap-1 mx-auto"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                돌아가기
              </button>
            </div>
          )}
        </div>

        {/* FAB */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent pointer-events-none">
          <button className="pointer-events-auto w-full py-4 rounded-[20px] bg-[#4A443A] text-white text-[16px] font-bold shadow-lg">
            {skipped ? '기록 저장하기' : '인증 완료!'}
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

export default Reflection;