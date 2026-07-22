import React from 'react';
import { PhoneFrame, Mascot } from './_shared/Shared';

export function MyPage() {
  // Simple fake data for graph
  const moodData = [40, 35, 50, 65, 60, 80, 75];
  
  return (
    <PhoneFrame>
      <div className="flex flex-col h-full bg-[#FDFBF7]">
        {/* Header */}
        <div className="px-6 pt-10 pb-6 flex justify-between items-center bg-white rounded-b-[32px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative z-10">
          <div>
            <h1 className="text-[22px] font-bold text-[#4A443A] flex items-center gap-2">
              지훈님의 기록
              <span className="bg-[#FFF9E5] text-[#D4A017] text-[11px] px-2 py-0.5 rounded-full font-bold">LV.2</span>
            </h1>
            <p className="text-[13px] text-[#898273] mt-1">조각이와 함께한 지 14일째</p>
          </div>
          <div className="w-12 h-12 bg-[#F5F1E6] rounded-full overflow-hidden flex items-center justify-center">
            <Mascot size={40} expression="happy" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">
          
          {/* Stats Row */}
          <div className="flex gap-3">
            <div className="flex-1 bg-white p-4 rounded-[20px] border border-[#F5F1E6] shadow-sm flex flex-col items-center justify-center">
              <span className="text-[11px] font-medium text-[#898273] mb-1">연속 참여</span>
              <div className="text-[20px] font-bold text-[#F4A261]">3일🔥</div>
            </div>
            <div className="flex-1 bg-white p-4 rounded-[20px] border border-[#F5F1E6] shadow-sm flex flex-col items-center justify-center">
              <span className="text-[11px] font-medium text-[#898273] mb-1">모은 조각</span>
              <div className="text-[20px] font-bold text-[#4A443A]">12개🧩</div>
            </div>
          </div>

          {/* Graph Section */}
          <div className="bg-white p-5 rounded-[24px] border border-[#F5F1E6] shadow-sm">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="font-bold text-[#4A443A]">움직인 날, 기분이 올라갔어요</h3>
                <p className="text-[11px] text-[#898273] mt-1">최근 7일간의 기분 변화와 활동 기록</p>
              </div>
            </div>

            <div className="relative h-32 w-full mt-4">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between">
                <div className="w-full h-px bg-[#F5F1E6]"></div>
                <div className="w-full h-px bg-[#F5F1E6]"></div>
                <div className="w-full h-px bg-[#F5F1E6]"></div>
              </div>
              
              {/* Line graph */}
              <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                <path 
                  d="M 10 80 C 40 80, 50 85, 80 70 C 110 55, 130 40, 160 45 C 190 50, 210 20, 240 25 C 270 30, 290 10, 320 15" 
                  fill="none" stroke="#FFD55F" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" 
                />
                
                {/* Dots */}
                <circle cx="10" cy="80" r="4" fill="#4A443A" />
                <circle cx="80" cy="70" r="4" fill="#4A443A" />
                <circle cx="160" cy="45" r="4" fill="#4A443A" />
                <circle cx="240" cy="25" r="4" fill="#4A443A" />
                <circle cx="320" cy="15" r="4" fill="#4A443A" />
              </svg>

              {/* Activity markers (puzzle pieces underneath dots) */}
              <div className="absolute top-[65px] left-[70px] bg-[#A8DADC] w-5 h-5 rounded-md flex items-center justify-center text-[10px] shadow-sm transform rotate-12">🧩</div>
              <div className="absolute top-[15px] left-[230px] bg-[#A8DADC] w-5 h-5 rounded-md flex items-center justify-center text-[10px] shadow-sm transform -rotate-12">🧩</div>
              <div className="absolute top-[5px] left-[310px] bg-[#A8DADC] w-5 h-5 rounded-md flex items-center justify-center text-[10px] shadow-sm transform rotate-6">🧩</div>
            </div>
            
            <div className="flex justify-between mt-4 text-[10px] text-[#898273] px-2">
              <span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span><span>일</span>
            </div>
          </div>

          {/* Domain Stats */}
          <div className="bg-white p-5 rounded-[24px] border border-[#F5F1E6] shadow-sm">
            <h3 className="font-bold text-[#4A443A] mb-4">내가 맞춘 조각 영역</h3>
            
            <div className="space-y-4">
              {[
                { name: "생활 리듬", count: 5, color: "bg-[#FFD55F]", percent: 60 },
                { name: "자기 돌봄", count: 3, color: "bg-[#F4A261]", percent: 35 },
                { name: "즐거움", count: 3, color: "bg-[#A8DADC]", percent: 35 },
                { name: "사회 진입", count: 1, color: "bg-[#E5E0D8]", percent: 15 },
              ].map(d => (
                <div key={d.name}>
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="font-medium text-[#4A443A]">{d.name}</span>
                    <span className="text-[#898273]">{d.count}개</span>
                  </div>
                  <div className="w-full bg-[#F5F1E6] h-2.5 rounded-full overflow-hidden">
                    <div className={`${d.color} h-full rounded-full`} style={{ width: `${d.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        
        {/* Bottom Nav Mock */}
        <div className="bg-white px-6 pb-8 pt-4 flex justify-between items-center border-t border-[#F5F1E6]">
          <button className="flex flex-col items-center gap-1 text-[#898273] opacity-50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <span className="text-[10px] font-medium">홈</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#898273] opacity-50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span className="text-[10px] font-medium">기록</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#4A443A]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span className="text-[10px] font-medium">마이</span>
          </button>
        </div>

      </div>
    </PhoneFrame>
  );
}

export default MyPage;