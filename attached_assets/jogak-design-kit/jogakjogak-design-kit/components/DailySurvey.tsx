import React, { useState } from 'react';
import { PhoneFrame, Mascot, qpInt } from './_shared/Shared';

const INTERESTS = ["음악", "동물", "그림", "게임", "요리", "운동"];

export function DailySurvey() {
  const [mood, setMood] = useState<number | null>(qpInt('mood'));
  const [domain, setDomain] = useState<number | null>(qpInt('domain'));
  const [interest, setInterest] = useState<string | null>(() => {
    const i = qpInt('interest');
    return i === null ? null : INTERESTS[i] ?? null;
  });

  const moods = [
    { id: 1, label: "매우 별로", color: "bg-[#FFB5A7]", text: "text-[#D96B5B]" },
    { id: 2, label: "별로", color: "bg-[#F4A261]", text: "text-[#B86B2F]" },
    { id: 3, label: "보통", color: "bg-[#E5E0D8]", text: "text-[#898273]" },
    { id: 4, label: "좋음", color: "bg-[#A8DADC]", text: "text-[#458C8F]" },
    { id: 5, label: "매우 좋음", color: "bg-[#A2D2FF]", text: "text-[#4986C2]" }
  ];

  // 타깃 영역(예: 생활 리듬)의 하위 활동만 노출 — 알고리즘 문서 2절 규칙
  const activities = [
    { id: 1, title: "수면", desc: "잠들고 일어나는 리듬", icon: "🌙" },
    { id: 2, title: "식사", desc: "챙겨 먹는 한 끼", icon: "🍚" },
    { id: 3, title: "규칙적 일상", desc: "작은 루틴 하나", icon: "⏰" },
    { id: 4, title: "잘 모르겠어요", desc: "조각이가 골라드릴게요", icon: "🧩" },
  ];

  const isComplete = mood !== null && domain !== null;

  return (
    <PhoneFrame>
      <div className="flex flex-col h-full relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-10 pb-32">
          <div className="flex items-center gap-4 mb-8">
            <Mascot size={48} expression="happy" />
            <div>
              <h1 className="text-xl font-bold text-[#4A443A]">오늘 하루는 어떤가요?</h1>
              <p className="text-[14px] text-[#898273]">조각이에게 당신의 상태를 알려주세요.</p>
            </div>
          </div>

          <div className="space-y-10">
            {/* Q1 */}
            <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-[16px] font-semibold text-[#4A443A] mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FFD55F] text-xs flex items-center justify-center font-bold">1</span>
                지금 기분이나 컨디션은 어때요?
              </h2>
              <div className="flex justify-between items-center bg-white p-4 rounded-[24px] shadow-sm border border-[#F5F1E6]">
                {moods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                      mood === m.id ? `${m.color} scale-110 shadow-md` : 'bg-[#F5F1E6] grayscale opacity-60'
                    }`}>
                      {m.id === 1 && <span className="text-xl">😞</span>}
                      {m.id === 2 && <span className="text-xl">🙁</span>}
                      {m.id === 3 && <span className="text-xl">😐</span>}
                      {m.id === 4 && <span className="text-xl">🙂</span>}
                      {m.id === 5 && <span className="text-xl">😄</span>}
                    </div>
                    <span className={`text-[11px] font-medium ${mood === m.id ? m.text : 'text-[#898273]'}`}>
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Q2 */}
            <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-[16px] font-semibold text-[#4A443A] mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FFD55F] text-xs flex items-center justify-center font-bold">2</span>
                오늘은 어떤 걸 해보고 싶나요?
              </h2>
              <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFF9E5] border border-[#F0E6C8]">
                <span className="text-[11px] font-semibold text-[#D4A017]">생활 리듬</span>
                <span className="text-[10px] text-[#898273]">지금 함께 맞추고 있는 조각</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {activities.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDomain(d.id)}
                    className={`p-4 rounded-[20px] text-left transition-all ${
                      domain === d.id 
                        ? 'bg-[#FFF9E5] border-2 border-[#FFD55F] shadow-sm' 
                        : 'bg-white border-2 border-transparent shadow-sm'
                    }`}
                  >
                    <div className="text-2xl mb-2">{d.icon}</div>
                    <div className="font-semibold text-[#4A443A] text-[15px] mb-1">{d.title}</div>
                    <div className="text-[11px] text-[#898273] leading-snug">{d.desc}</div>
                  </button>
                ))}
              </div>
            </section>
            
            {/* Weekly Interest Card */}
            <section className="animate-slide-up mt-8 pt-8 border-t border-[#E5E0D8] border-dashed" style={{ animationDelay: '0.3s' }}>
              <div className="bg-[#FFF9E5] p-5 rounded-[24px] shadow-sm border border-[#F5F1E6] relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#D4A017] px-2 py-1 bg-white rounded-md mb-2 inline-block shadow-sm">일주일에 한 번만 물어요</span>
                      <h2 className="text-[15px] font-semibold text-[#4A443A]">요즘 빠져있는 게 있나요?</h2>
                    </div>
                    <button className="text-[11px] text-[#898273] underline underline-offset-2">건너뛰기</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {INTERESTS.map(item => (
                      <button
                        key={item}
                        onClick={() => setInterest(item)}
                        className={`px-3 py-1.5 text-[13px] rounded-xl font-medium transition-colors ${
                          interest === item ? 'bg-[#FFD55F] text-[#4A443A] shadow-sm' : 'bg-white text-[#898273] border border-[#E5E0D8]'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Floating Action Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent pt-12 pointer-events-none">
          <button 
            disabled={!isComplete}
            className={`pointer-events-auto w-full py-4 rounded-[20px] text-[16px] font-bold transition-all ${
              isComplete 
                ? 'bg-[#FFD55F] text-[#4A443A] shadow-[0_8px_20px_rgba(255,213,95,0.3)] hover:bg-[#F2C33D] translate-y-0 opacity-100' 
                : 'bg-[#E5E0D8] text-[#898273] translate-y-2 opacity-0'
            }`}
          >
            조각 추천받기
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

export default DailySurvey;