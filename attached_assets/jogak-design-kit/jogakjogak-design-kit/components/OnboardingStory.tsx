import React, { useState } from 'react';
import { PhoneFrame, Mascot, ProgressBar, qpInt } from './_shared/Shared';

export function OnboardingStory() {
  const [step, setStep] = useState(() => Math.min(Math.max(qpInt('step') ?? 0, 0), 3));

  const stories = [
    {
      title: "아무것도\n하고 싶지 않은 날이 있죠?",
      desc: "이불 밖으로 나가기도 벅차고,\n모든 것이 무의미하게 느껴질 때가 있어요.",
      mascot: "sad" as const,
      bg: "bg-[#F5F1E6]",
    },
    {
      title: "우리는 보통 기분이\n나아지면 움직이려 해요",
      desc: "하지만 무기력할 때 기다리기만 하면\n오히려 더 우울해지곤 하죠.",
      mascot: "curious" as const,
      bg: "bg-[#FDFBF7]",
      illustration: (
        <div className="relative w-48 h-48 mx-auto mt-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-2xl shadow-sm text-sm text-[#898273]">기분 저하</div>
          <svg className="absolute top-10 left-10 w-28 h-28 text-[#E5E0D8]" viewBox="0 0 100 100">
            <path d="M 50 10 A 40 40 0 1 1 10 50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
          <div className="absolute bottom-6 right-0 bg-white px-4 py-2 rounded-2xl shadow-sm text-sm text-[#898273]">미루기/회피</div>
          <div className="absolute bottom-6 left-0 bg-[#F5F1E6] px-4 py-2 rounded-2xl shadow-sm text-sm font-medium text-[#4A443A]">더 우울함</div>
        </div>
      )
    },
    {
      title: "일단 아주 작은 것부터\n움직여 볼까요?",
      desc: "신기하게도 작은 행동을 먼저 하면,\n그 뒤에 기분이 서서히 따라온답니다.",
      mascot: "happy" as const,
      bg: "bg-[#FFF9E5]",
      illustration: (
        <div className="flex flex-col items-center justify-center mt-8 gap-4">
          <div className="bg-white px-6 py-3 rounded-full shadow-sm text-[#4A443A] font-semibold border-2 border-[#FFD55F]">
            작은 행동
          </div>
          <div className="w-1 h-8 bg-gradient-to-b from-[#FFD55F] to-transparent rounded-full" />
          <div className="bg-[#FFD55F] px-6 py-3 rounded-full text-[#4A443A] font-semibold shadow-md animate-pulse-soft">
            기분이 따라옴!
          </div>
        </div>
      )
    },
    {
      title: "이제부터 당신만의\n작은 조각을 맞춰볼까요?",
      desc: "매일 조금씩 성취감과 즐거움을 주는\n나만의 조각들을 찾아봐요.",
      mascot: "encouraging" as const,
      bg: "bg-[#FDFBF7]",
    }
  ];

  const current = stories[step];

  return (
    <PhoneFrame className={current.bg + " transition-colors duration-500"}>
      <div className="flex-1 flex flex-col pt-12 pb-8 px-6">
        <div className="w-full flex justify-between items-center mb-8">
          <div className="w-full max-w-[120px]">
            <ProgressBar progress={((step + 1) / stories.length) * 100} />
          </div>
          <button className="text-sm font-medium text-[#898273]" onClick={() => setStep(stories.length - 1)}>
            건너뛰기
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center animate-fade-in" key={step}>
          <div className="mb-10 flex justify-center animate-float">
            <Mascot size={140} expression={current.mascot} />
          </div>
          
          <h1 className="text-2xl font-bold text-[#4A443A] leading-tight mb-4 whitespace-pre-line text-center">
            {current.title}
          </h1>
          <p className="text-[15px] text-[#898273] leading-relaxed whitespace-pre-line text-center">
            {current.desc}
          </p>

          {current.illustration}
        </div>

        <div className="mt-8">
          <button 
            className="w-full py-4 rounded-[20px] jogak-button jogak-button-primary text-[16px]"
            onClick={() => {
              if (step < stories.length - 1) setStep(step + 1);
            }}
          >
            {step === stories.length - 1 ? "내 가치 찾기" : "다음"}
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

export default OnboardingStory;