# App-main React 이관 & 스텝바이스탭(StepByStep) 통합 사양서 (Design Spec)

- **작성일**: 2026년 9월 2일
- **프로젝트**: 스텝바이스탭 (StepByStep) in `App-main/artifacts/jogak`
- **목표**: Vanilla JS 프로토타입의 핵심 기능(선택적 사진 빛조각 보상, 아이소메트릭 픽셀 캔버스, SDT A0~A4 자율성 레벨, B2G 회복 리포트)을 React + TypeScript 메인 프로젝트로 완전 통합.

---

## 1. 이관 및 아키텍처 구조

### 1.1 디렉토리 및 모듈 구성 (`artifacts/jogak/src`)

```
App-main/artifacts/jogak/src/
├── lib/
│   ├── photo-processor.ts       # EXIF 위치정보 삭제, 캔버스 재인코딩, 흐림 필터 유틸
│   ├── pixel-engine.ts          # 아이소메트릭 방/현관/집앞/동네 픽셀 드로잉 엔진
│   └── store.ts                 # [수정] SDT 자율성 레벨(A0~A4) 및 회복 스탯 상태 추가
├── components/
│   ├── IsoCanvas.tsx            # React용 픽셀 공간 렌더링 캔버스 컴포넌트
│   ├── PhotoUploadModal.tsx     # 선택적 사진 빛조각 등록 모달
│   └── MascotBadge.tsx          # 마스코트 '디딤이' 배지 컴포넌트
├── pages/
│   ├── recovery-report.tsx      # SDT 자율성 단계 & 기관 제안(기지개센터·안무서운회사) 리포트 뷰
│   └── growth.tsx               # [수정] 픽셀 공간 지도 + 빛 조각 통합 뷰
└── App.tsx                      # [수정] recovery_report 뷰 라우팅 추가
```

---

## 2. 세부 컴포넌트 사양

### 2.1 `lib/photo-processor.ts`
- HTML5 Canvas 기반 사진 크롭 및 EXIF GPS 위치정보 완전 삭제.
- 프라이버시 보호 모드 (`blur = true`) 시 비네팅 & 온기 Gaussian Blur 처리.

### 2.2 `lib/pixel-engine.ts` & `components/IsoCanvas.tsx`
- 160x152 비트맵 논리 좌표계를 React Canvas `useRef` 및 `useEffect` 렌더링 훅으로 포팅.
- 방 안, 현관, 집 앞, 동네, 도시 5개 공간 픽셀 타일 및 사진 썸네일 오버레이 렌더링.

### 2.3 `pages/recovery-report.tsx`
- SDT 기반 자율성 레벨 (A0: 왕초보 수락 ~ A4: 주간 자율 수립) 계산 및 배지 출력.
- 누적 회복 스탯 (시도한 행동, 빛조각, 쉼터, 남긴 사진 조각).
- 서울 기지개 센터 / 안 무서운 회사 / 닉 커넥트 제안용 B2G 피치 스마트 카드.

### 2.4 `@/lib/store.ts` & `App.tsx`
- View 타입 확장: `'auth' | 'onboarding' | ... | 'recovery_report'`
- `recovery_report` 뷰 전환 버튼 및 헤더 네비게이션 연동.
