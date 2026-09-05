# '나의 집' 보상체계 & UX 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 '현관' 보상을 '나의 집(My Home)' 통합 룸 개편으로 확장하고, 챌린지 성격에 대응하는 꾸미기 소품 획득, 서브 옵션 사진 인증, 챌린지 완수 → 보상 획득 → 즉시 배치의 원스톱 UX를 구축한다.

**Architecture:** 기존 React + TypeScript 프로젝트 (`App-main/artifacts/jogak`)의 `decor.ts`, `rewards.ts`, `store.tsx`, `reflection.tsx`, `deco-room.tsx`를 개편하고, `photo-processor.ts` 및 `RewardClaimModal.tsx` 신규 모듈을 연결하여 기존 데이터와의 호환성을 유지한 채 MVP 보상 경험을 고도화한다.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide React, Framer Motion, HTML5 Canvas API, LocalStorage.

**Spec:** `App-main/docs/superpowers/specs/2026-09-02-app-main-integration-design.md`

## Global Constraints
- **작업 대상 디렉토리**: `c:\Users\정민\Downloads\조각조각_사진인증_프로토타입\App-main\artifacts\jogak`
- **핵심 정체성**: 낙인/경쟁 없는 '일상 회복' (BA + SDT), 100% 로컬 데이터 저장 (프라이버시 안전지대)
- **앱 명칭 & 마스코트**: 스텝바이스탭 (StepByStep) / 동행자 디딤이 (🌙)
- **절대적 원칙**: 기존 유저 진행 데이터(`user.badges`, `user.roomPlacements`) 마이그레이션 호환성 보장

---

## A. 데이터 모델 설계

```typescript
// 1. 챌린지 인증 옵션 확장
export type VerificationType = 'text_only' | 'photo_optional' | 'photo_recommended';

export interface Challenge {
  id: string;
  title: string;
  area: 'rhythm' | 'selfcare' | 'relationship' | 'social';
  verificationType: VerificationType;
  rewardCategoryId: string; // 예: 'self-walk', 'rhythm-light'
}

// 2. 가구/소품 아이템 확장 (decor.ts)
export interface FurnitureItem {
  id: string;
  name: string;
  category: 'bed' | 'rug' | 'lighting' | 'storage' | 'plant' | 'decor' | 'seating' | 'window' | 'desk';
  defaultZone: 'bedroom' | 'living' | 'desk' | 'window' | 'entrance' | 'wall';
  defaultPos: { x: number; y: number };
  size: { w: number; h: number };
  rotatable: boolean;
  type?: 'floor' | 'wall';
  unlockCategoryId: string; // rewards.ts 카테고리 ID
  iconEmoji: string;
  description: string;
}

// 3. 사진 인증 기록 모델 (photo-processor.ts)
export interface PhotoVerification {
  id: string;
  challengeId: string;
  photoDataUrl: string; // Base64 (EXIF 제거)
  note?: string;
  isBlurred: boolean;
  createdAt: string;
}

// 4. 유저 상태 및 보관함 확장 (store.tsx)
export interface UserState {
  // ... 기존 유저 필드 유지
  inventoryItems: string[]; // 보유 중이나 아직 방에 놓지 않은 아이템 ID 배열
  roomPlacements: PlacedFurniture[]; // 방에 실제 배치된 아이템 배열
  recentEarnedItem: FurnitureItem | null; // 방금 획득한 보상 아이템 (팝업 연결용)
  photoVerifications: Record<string, PhotoVerification>; // challengeId별 사진 기록
}
```

---

## B. 주요 화면 및 재사용 가능 여부

| 화면 이름 | 담당 파일 / 컴포넌트 | 재사용 여부 및 변경 사항 |
|---|---|---|
| **챌린지 상세** | `pages/daily-checkin.tsx` | **[재사용 80%]** 챌린지 수락 카드에 `verificationType` 태그 표시 추가 |
| **챌린지 완료/회고** | `pages/reflection.tsx` | **[재사용 70%]** P·M 슬라이더 유지 + `📷 사진으로 인증하기` 서브 섹션 추가 |
| **보상 획득 팝업** | `components/RewardClaimModal.tsx` | **[신규 100%]** "🎉 보상 획득 ➔ [내 집에 바로 배치하기]" 모달 컴포넌트 |
| **나의 집 (My Home)** | `pages/deco-room.tsx` | **[재사용 60%]** 10x10 그리드 엔진 유지 + '통합 룸(My Studio Room)' 배경/구역 시각화 |
| **아이소메트릭 맵** | `components/IsoCanvas.tsx` | **[재사용 90%]** 픽셀 방 안/현관/집 앞 렌더링 유지 |
| **아이템 보관함** | `components/InventoryDrawer.tsx` | **[재사용 50%]** 기존 가구 카탈로그 모달을 '내 보관함' 탭 분리로 개선 |

---

## C. 단계별 개발 계획 (Task List & Dependencies)

### Phase 1 — Data & Reward Logic (데이터 및 보상 로직 개편)
**Dependency**: 없음

#### Task 1: 가구 카탈로그 & 카테고리 매핑 확장
- **목적**: 챌린지 종류(운동, 독서, 정리, 요리 등)에 직접 응답하는 18종의 가구/소품 데이터를 정의한다.
- **수정 파일**: `artifacts/jogak/src/lib/decor.ts`, `artifacts/jogak/src/lib/rewards.ts`
- **구체적 구현 내용**:
  - `FURNITURE_CATALOG`에 `defaultZone`, `defaultPos`, `iconEmoji` 속성 추가 및 18종 아이템 데이터 작성.
  - `unlockInfo()` 및 `isUnlocked()`가 신규 소품 카테고리와 100% 호환되도록 수정.
- **테스트 방법**: `FURNITURE_CATALOG.forEach(f => assert(f.unlockCategoryId))` 유닛 데이터 검증.
- **완료 조건**: 챌린지 12개 카테고리 모두에 대응하는 1대1/1대N 가구 소품 데이터 완성.

#### Task 2: 유저 인벤토리 & 보상 지급 함수 고도화
- **목적**: 챌린지 완수 시 카테고리에 맞는 소품을 지급하고 유저 인벤토리(`inventoryItems`)에 추가한다.
- **수정 파일**: `artifacts/jogak/src/lib/rewards.ts`, `artifacts/jogak/src/lib/store.tsx`
- **구체적 구현 내용**:
  - `applyCompletion()` 함수에서 3회 카테고리 달성 시 `inventoryItems` 및 `recentEarnedItem` 상태 자동 세팅.
  - 동일 아이템 중복 획득 시 카운트 증가 처리.
- **테스트 방법**: `applyCompletion` 호출 후 유저 `inventoryItems` 배열에 아이템 ID 추가 확인.
- **완료 조건**: 챌린지 완수 로직에서 배지뿐만 아니라 가구 아이템이 인벤토리에 정상 저장됨.

---

### Phase 2 — Challenge Completion & UX Loop (완료 ➔ 즉시 배치 동선)
**Dependency**: Phase 1

#### Task 3: 획득 보상 모달 (`RewardClaimModal.tsx`) 개발
- **목적**: 챌린지 완료 후 획득한 가구를 보여주고 `[내 집에 바로 배치하기]` 버튼으로 이동 동선을 제공한다.
- **새 파일**: `artifacts/jogak/src/components/RewardClaimModal.tsx`
- **수정 파일**: `artifacts/jogak/src/pages/reflection.tsx`
- **구체적 구현 내용**:
  - 획득 아이템 일러스트/에모지, 아이템 명칭, 추천 구역 안내 렌더링.
  - `[🏡 내 집에 바로 배치하기]` 클릭 시 `setView('deco_room')` 호출 및 해당 아이템 즉시 선택 상태 전달.
  - `[나중에 보관함에서 배치]` 클릭 시 홈 화면으로 이동.
- **테스트 방법**: 챌린지 회고 완료 후 팝업 출력 및 버튼 클릭 시 `deco_room` 화면 이동 확인.
- **완료 조건**: 단절 없는 완료 ➔ 배치 UX 동선 완성.

---

### Phase 3 — Photo Verification Sub-Option (서브 사진 인증)
**Dependency**: Phase 1

#### Task 4: 사진 인증 서브 옵션 UI & EXIF 처리 연결
- **목적**: 필수 인증 부담 없이 서브 옵션으로 `📷 사진으로 인증하기` 기능과 EXIF 제거 로직을 결합한다.
- **수정 파일**: `artifacts/jogak/src/pages/reflection.tsx`
- **재사용 파일**: `artifacts/jogak/src/lib/photo-processor.ts`
- **구체적 구현 내용**:
  - `reflection.tsx` 하단에 `📷 사진으로 인증하기 (선택)` 서브 버튼 추가.
  - 이미지 업로드 시 `cleanAndCompressPhoto()` 호출로 EXIF 자동 제거 및 Base64 압축.
  - `🔒 프라이버시 흐리게 보관` 토글 체크 시 12px Gaussian Blur 처리 후 저장.
- **테스트 방법**: 사진 업로드 후 프리뷰 렌더링 및 EXIF 위치정보 제거 확인.
- **완료 조건**: 사진 인증 선택 시 프라이버시가 보장된 채 기록 저장이 완료됨.

---

### Phase 4 & 5 — My Home UI & Item Placement (통합 룸 & 배치 UX)
**Dependency**: Phase 1, Phase 2

#### Task 5: '나의 집 (My Home)' 통합 룸 공간 레이아웃 개편
- **목적**: 단순 10x10 바닥에서 침실/책상/창가/거실 구역이 시각화된 통합 룸(My Studio Room)으로 개편한다.
- **수정 파일**: `artifacts/jogak/src/pages/deco-room.tsx`
- **구체적 구현 내용**:
  - 배경 그래픽을 6개 구역(창가, 벽면, 책상, 거실, 침실, 현관) 구분이 드러나는 포근한 파스텔 톤 룸 인터페이스로 업데이트.
  - 신규 획득 가구가 배치되었을 때 빛나는 펄스(Pulse) 강조 효과 추가.
- **테스트 방법**: `deco-room` 진입 시 통합 룸 구역 영역 렌더링 확인.
- **완료 조건**: 가구가 구역별로 아름답게 배치되는 룸 인터페이스 완성.

#### Task 6: 자동 추천 배치 & 보관함 UI 개선
- **목적**: 새로 얻은 아이템을 터치 한 번으로 추천 위치에 자동 배치하는 편의성을 제공한다.
- **수정 파일**: `artifacts/jogak/src/pages/deco-room.tsx`, `artifacts/jogak/src/lib/decor.ts`
- **구체적 구현 내용**:
  - 보관함에서 가구 선택 시 `item.defaultPos` 좌표에 자동으로 1차 배치되는 기능 구현.
  - 배치된 가구를 유저가 원할 경우 드래그 및 회전(0/90/180/270도)할 수 있는 조작 핸들 유지.
- **테스트 방법**: 카탈로그에서 아이템 터치 시 추천 위치 자동 삽입 및 이동 테스트.
- **완료 조건**: 피로감 없는 자동 추천 배치 및 자유 편집 지원.

---

### Phase 6 & 7 — Integration, Testing & Verification (통합 및 최종 검증)
**Dependency**: Phase 1 ~ 5

#### Task 7: 전체 시스템 연동 & 회복 리포트 시각화
- **목적**: 챌린지 수행 ➔ 회고 ➔ 사진 남기기 ➔ 보상 획득 ➔ 집 배치 ➔ 회복 리포트 연동 검증.
- **수정 파일**: `artifacts/jogak/src/App.tsx`, `artifacts/jogak/src/pages/growth.tsx`, `artifacts/jogak/src/pages/recovery-report.tsx`
- **구체적 구현 내용**:
  - 배치된 가구 수와 챌린지 완수 기록이 `recovery-report.tsx` (B2G 피치 스마트 카드)와 `growth.tsx`에 연동되도록 바인딩.
- **테스트 방법**: E2E 시나리오 (챌린지 완료부터 리포트 뷰 확인까지) 전체 플로우 테스트.
- **완료 조건**: 모든 기능이 에러 없이 연결되고 정상 동작함.

---

## D. 위험요소 및 대응 방안 (Risk Management)

| 위험 요소 | 영향도 | 대응 방안 |
|---|---|---|
| **1. 기존 데이터 Regression** | **HIGH** | 기존 유저의 `user.roomPlacements` 및 `user.badges` 데이터가 손상되지 않도록, 데이터 읽기 시 신규 속성(`defaultZone` 등)의 **fallback 기본값** 처리 |
| **2. LocalStorage 용량 초과** | **MEDIUM** | 사진 Base64 저장 시 용량 초과 위험 방지를 위해 Canvas 800px 마이크로 크롭 및 JPEG 0.75 압축 적용, 초과 시 구 기록 사진 자동 정리 |
| **3. 모바일 반응형 터치 간섭** | **MEDIUM** | 10x10 그리드 가구 드래그 시 모바일 스크롤과 충돌 방지를 위해 `touch-action: none` 및 Framer-Motion `dragElastic={0.2}` 적용 |
| **4. 기존 보상 체계와 충돌** | **LOW** | 기존 뱃지 획득 로직을 훼손하지 않고, 뱃지 획득 시 100% 대응 가구가 인벤토리에 추가되는 래퍼(Wrapper) 방식으로 구현 |

---

## 📌 Phase별 추진 요약 (Executive Summary)

- **Phase 1 — Data / Reward logic**: 챌린지 카테고리별 18종 소품 데이터 정의 및 인벤토리 저장 로직 고도화
- **Phase 2 — Challenge completion**: 챌린지 완료 팝업 내 `[🏡 내 집에 바로 배치하기]` 원스톱 이동 UX 구축
- **Phase 3 — Photo verification**: 프라이버시(EXIF 제거, 흐림)가 보장되는 서브 사진 인증 모듈 연결
- **Phase 4 — My Home UI**: 현관 중심에서 '나의 집 통합 룸(My Studio Room)'으로 공간 비주얼 개편
- **Phase 5 — Item placement**: 터치 한 번 자동 추천 배치 + 드래그/회전 하이브리드 배치 UX 구현
- **Phase 6 — Integration**: 성장 지도, 마이페이지, B2G 회복 리포트 뷰와 전면 연동
- **Phase 7 — Testing & verification**: E2E 플로우 검증 및 모바일 반응형/프라이버시 안전성 종합 점검
