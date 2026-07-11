import { Area, AREAS } from "./classifier";
import { Challenge } from "@workspace/api-client-react";

export const FALLBACK_BANK: Record<Area, Record<number, Omit<Challenge, 'area' | 'level'>[]>> = {
  [AREAS.rhythm]: {
    1: [
      { title: "오늘 일어난 시간 기록하기", minutes: 1, reflectQ: "기록할 때 기분이 어땠나요?" },
      { title: "창문 틈새로 들어오는 빛 느껴보기", minutes: 1, reflectQ: "빛을 느낄 때 기분이 어땠나요?" },
      { title: "물 한 모금 마시기", minutes: 1, reflectQ: "물을 마시니 어땠나요?" }
    ],
    2: [
      { title: "커튼 열기", minutes: 2, reflectQ: "커튼을 여니 어땠나요?" },
      { title: "물 한 컵 마시기", minutes: 2, reflectQ: "물을 마시니 몸이 깨는 느낌이었나요?" },
      { title: "방 환기시키기", minutes: 2, reflectQ: "바람을 쐬니 어땠나요?" }
    ],
    3: [
      { title: "기상 알람 하나 맞춰두기", minutes: 2, reflectQ: "알람을 맞추니 내일이 기대되나요?" },
      { title: "밤에 스마트폰 끄고 5분 눈 감기", minutes: 5, reflectQ: "눈을 감고 있으니 어땠나요?" },
      { title: "간단한 아침 식사 챙기기", minutes: 10, reflectQ: "아침을 먹으니 기분이 어땠나요?" }
    ],
    4: [
      { title: "아침 햇빛 5분 쬐기", minutes: 5, reflectQ: "햇빛을 쬐니 어땠나요?" },
      { title: "정해진 시간에 식사하기", minutes: 15, reflectQ: "시간을 지켜서 먹으니 어땠나요?" },
      { title: "가벼운 아침 산책", minutes: 10, reflectQ: "걷는 동안 뭐가 제일 괜찮았어요?" }
    ],
    5: [
      { title: "3일 연속 기상 시간 기록하기", minutes: 1, reflectQ: "연속으로 기록하니 어땠나요?" },
      { title: "하루 계획 간단히 세우기", minutes: 10, reflectQ: "계획을 세우니 어땠나요?" },
      { title: "나만의 저녁 루틴 만들기", minutes: 15, reflectQ: "루틴을 실천해보니 어땠나요?" }
    ]
  },
  [AREAS.selfcare]: {
    1: [
      { title: "지금 기분 이모지 하나 고르기", minutes: 1, reflectQ: "고른 이모지가 지금 기분과 잘 맞나요?" },
      { title: "크게 심호흡 세 번 하기", minutes: 1, reflectQ: "심호흡을 하니 조금 편해졌나요?" },
      { title: "거울 보고 미소 지어보기", minutes: 1, reflectQ: "거울 속 내 모습은 어땠나요?" }
    ],
    2: [
      { title: "세수 또는 양치하기", minutes: 3, reflectQ: "개운해진 기분이 드나요?" },
      { title: "좋아하는 음악 한 곡 듣기", minutes: 5, reflectQ: "오늘 들은 음악은 어느 쪽이었어요?" },
      { title: "따뜻한 차 한 잔 마시기", minutes: 5, reflectQ: "차를 마시니 조금 안정되나요?" }
    ],
    3: [
      { title: "오늘 감정 한 줄 기록하기", minutes: 2, reflectQ: "감정을 글로 적어보니 어땠나요?" },
      { title: "좋아하는 글 한 쪽 읽기", minutes: 5, reflectQ: "오늘 읽은 글은 어느 쪽이었어요?" },
      { title: "방 한 구석 간단히 정리하기", minutes: 5, reflectQ: "정리된 곳을 보니 어땠나요?" }
    ],
    4: [
      { title: "10분 스트레칭 또는 샤워하기", minutes: 10, reflectQ: "몸을 움직이니 어땠나요?" },
      { title: "창가 화분·식물 돌보기", minutes: 5, reflectQ: "식물을 돌보니 어땠나요?" },
      { title: "나를 위한 작은 요리 해보기", minutes: 15, reflectQ: "다음에 또 한다면?" }
    ],
    5: [
      { title: "집 근처 10분 산책하기", minutes: 10, reflectQ: "걷는 동안 뭐가 제일 괜찮았어요?" },
      { title: "나에게 칭찬 한 마디 하기", minutes: 2, reflectQ: "칭찬을 들으니 기분이 어땠나요?" },
      { title: "평소 가보고 싶던 동네 카페 다녀오기", minutes: 30, reflectQ: "카페 분위기는 어땠나요?" }
    ]
  },
  [AREAS.relationship]: {
    1: [
      { title: "가족·지인 메시지 하나 '읽음'만 하기", minutes: 1, reflectQ: "읽기만 해도 괜찮았나요?" },
      { title: "좋아하는 유튜버 영상 하나 보기", minutes: 10, reflectQ: "영상을 보니 기분이 어땠나요?" },
      { title: "창문 밖으로 지나가는 사람 1명 보기", minutes: 1, reflectQ: "그냥 보기만 하니 어땠나요?" }
    ],
    2: [
      { title: "관심 커뮤니티 글 1개 읽어보기", minutes: 5, reflectQ: "글을 읽어보니 어땠나요?" },
      { title: "가족에게 짧은 이모티콘 하나 보내기", minutes: 1, reflectQ: "보내고 나서 어땠나요?" },
      { title: "SNS 게시물에 '좋아요' 하나 누르기", minutes: 1, reflectQ: "좋아요를 누르니 어땠나요?" }
    ],
    3: [
      { title: "관심 글에 이모지/댓글 하나 남기기", minutes: 3, reflectQ: "댓글을 남겨보니 어땠나요?" },
      { title: "가족과 짧은 눈인사 나누기", minutes: 1, reflectQ: "눈을 마주치니 어땠나요?" },
      { title: "친구의 프로필 사진 구경하기", minutes: 2, reflectQ: "친구의 일상을 보니 어땠나요?" }
    ],
    4: [
      { title: "안부 문자 한 통 보내기", minutes: 5, reflectQ: "문자를 보내보니 어땠나요?" },
      { title: "가족에게 '고마워' 한 마디 하기", minutes: 1, reflectQ: "말을 건네니 어땠나요?" },
      { title: "편의점 직원에게 작게 인사하기", minutes: 2, reflectQ: "인사를 건네니 어땠나요?" }
    ],
    5: [
      { title: "짧은 통화 한 번 걸어보기", minutes: 10, reflectQ: "목소리를 들으니 어땠나요?" },
      { title: "친구와 가벼운 차 한 잔 약속 잡기", minutes: 5, reflectQ: "약속을 잡으니 어땠나요?" },
      { title: "지인에게 안부 전화 한 통 하기", minutes: 10, reflectQ: "전화를 해보니 어땠나요?" }
    ]
  },
  [AREAS.social]: {
    1: [
      { title: "관심 직무/분야 하나 생각만 해보기", minutes: 3, reflectQ: "생각해본 분야는 어땠나요?" },
      { title: "책상 위 한 곳 정리하기", minutes: 5, reflectQ: "정리를 하니 기분이 어땠나요?" },
      { title: "인터넷 기사 제목 3개 읽기", minutes: 2, reflectQ: "새로운 소식을 보니 어땠나요?" }
    ],
    2: [
      { title: "관심 분야 정보 5분 탐색하기", minutes: 5, reflectQ: "새로운 정보를 알게 되니 어땠나요?" },
      { title: "관심 있는 책 목차 읽어보기", minutes: 5, reflectQ: "어떤 책이었나요?" },
      { title: "동네 도서관 위치 검색해보기", minutes: 2, reflectQ: "위치를 확인하니 어땠나요?" }
    ],
    3: [
      { title: "이력서 한 줄(내 강점) 써보기", minutes: 10, reflectQ: "내 강점을 적어보니 어땠나요?" },
      { title: "편의점·카페에서 직접 주문해보기", minutes: 15, reflectQ: "직접 주문하니 어땠나요?" },
      { title: "관심 있는 강의 1개 찜해두기", minutes: 5, reflectQ: "강의 내용을 보니 어땠나요?" }
    ],
    4: [
      { title: "지역 청년지원 정보 하나 확인·저장하기", minutes: 10, reflectQ: "도움이 될 것 같나요?" },
      { title: "관심 분야 블로그/기사 스크랩하기", minutes: 5, reflectQ: "스크랩한 내용을 보니 어땠나요?" },
      { title: "짧은 온라인 강의 1개 수강하기", minutes: 15, reflectQ: "새로운 걸 배우니 어땠나요?" }
    ],
    5: [
      { title: "희망 회사·프로그램 1곳 조사 + 요건 정리하기", minutes: 20, reflectQ: "구체적으로 찾아보니 어땠나요?" },
      { title: "이력서 양식 다운받아 첫 부분 채우기", minutes: 15, reflectQ: "이력서를 채우니 어땠나요?" },
      { title: "가까운 주민센터 방문해보기", minutes: 30, reflectQ: "다녀오니 어땠나요?" }
    ]
  }
};

export function getFallbackChallenges(area: Area, low: number, high: number) {
  const lo = Math.min(5, Math.max(1, Math.min(low, high)));
  const hi = Math.min(5, Math.max(1, Math.max(low, high)));
  const mid = Math.min(hi, Math.max(lo, Math.round((lo + hi) / 2)));
  const usedTitles = new Set<string>();
  const dayOffset = new Date().getDay(); // stable within a real day

  return [lo, mid, hi].map(l => {
    const choices = FALLBACK_BANK[area][l];
    let picked = choices[(dayOffset) % choices.length];
    // avoid duplicate titles when band levels repeat
    if (usedTitles.has(picked.title)) {
      picked = choices.find(c => !usedTitles.has(c.title)) ?? picked;
    }
    usedTitles.add(picked.title);
    return {
      ...picked,
      area: area as any,
      level: l
    };
  });
}
