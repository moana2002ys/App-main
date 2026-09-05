# Pixel Design System & 마스코트 '디딤이' 인터랙션 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공식 마스코트 `디딤이` (Pixel Bird)의 6가지 상태 기반 반응형 컴포넌트를 구축하고, `image-rendering: pixelated` 전용 스타일, My Studio Room 픽셀 가구 렌더링, Reward Reveal 애니메이션 및 모바일 반응형 검증을 완료한다.

**Architecture:** 기존 React + TypeScript 모노레포 (`App-main/artifacts/jogak`) 내 `Mascot.tsx` 신규 컴포넌트 생성, `decor.ts` / `Furniture.tsx` 픽셀 아웃라인 SVG 스키마 확장, `RewardClaimModal.tsx` 마스코트 모션 바인딩, `deco-room.tsx` 레이어드 룸 렌더링 구조 구축.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Framer Motion, HTML5 Canvas/SVG, CSS `image-rendering`.

**Spec:** `App-main/docs/superpowers/specs/2026-09-02-app-main-integration-design.md`

## Global Constraints
- **작업 대상 디렉토리**: `c:\Users\정민\Downloads\조각조각_사진인증_프로토타입\App-main\artifacts\jogak`
- **디자인 원칙**: "Modern UI Shell + Pixel Art World Heart" (UI에는 가독성 높은 폰트 및 모던 라운드 카드 유지, World 에셋에만 픽셀 스타일 적용)
- **픽셀 렌더링 보호**: `image-rendering: pixelated`는 픽셀 타일 및 마스코트/가구 에셋에만 국한 (UI 카드 및 사용자 사진 적용 금지)
- **마스코트 원본 유지**: `디딤이` (Warm Brown + Cream + Orange Beak) 본래 컬러/체형 100% 보존

---

## A. 데이터 & 에셋 스키마 설계

```typescript
// 1. 마스코트 인터랙션 상태 모델 (Mascot.tsx)
export type MascotState = 'idle' | 'welcome' | 'happy' | 'jump' | 'rest' | 'celebrate';
export type MascotSize = 'sm' | 'md' | 'lg' | 'xl';

export interface MascotProps {
  state?: MascotState;
  size?: MascotSize;
  className?: string;
  speechBubble?: string;
  onClick?: () => void;
}

// 2. 픽셀 아이템 확장 스키마 (decor.ts)
export interface FurnitureItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  size: { w: number; h: number };
  rotatable: boolean;
  type?: 'floor' | 'wall';
  unlockCategoryId: string;
  defaultZone?: RoomZone;
  defaultPos?: { x: number; y: number };
  iconEmoji?: string;
  description?: string;
  pixelSvgPath?: string; // 픽셀 아트 SVG 경로/렌더러
}
```

---

## B. 주요 화면 및 마스코트 배치 포인트

| 화면 / 컴포넌트 | 파일 경로 | 마스코트 상태 (`state`) | UX 역할 |
|---|---|---|---|
| **나의 집 (My Home)** | `pages/deco-room.tsx` | `idle` / `rest` | 방 한가운데서 졸거나 유저를 기다림 |
| **나의 집 첫 진입** | `pages/deco-room.tsx` | `welcome` | 한쪽 날개를 들고 2초간 반갑게 인사 |
| **사후 평정 완료** | `pages/reflection.tsx` | `happy` / `jump` | 챌린지 완수 시 함께 방방 뛰며 기뻐함 |
| **보상 획득 모달** | `components/RewardClaimModal.tsx` | `celebrate` | 보상 상자/소품을 머리 위에 들고 축하 |
| **사진 인증 성공** | `pages/reflection.tsx` | `happy` | 프라이버시가 안전하게 보호됨을 알림 |
| **빈 보관함 안내** | `components/InventoryDrawer.tsx` | `idle` | 챌린지를 시도해보라는 따뜻한 안내 |

---

## C. 단계별 개발 계획 (Task List & Dependencies)

### Phase 1 — Mascot Component & Asset System (`Mascot.tsx`)
**Dependency**: 없음

#### Task 1: 픽셀 마스코트 `Mascot.tsx` 생성
- **목적**: `state`(`idle`, `welcome`, `happy`, `jump`, `rest`, `celebrate`) 및 `size`에 따라 정교하게 반응하는 독립된 SVG 픽셀 마스코트 컴포넌트를 구축한다.
- **신규 파일**: `artifacts/jogak/src/components/Mascot.tsx`
- **구체적 구현 내용**:
  - 다크 브라운 아웃라인(`stroke="#5C4033"`), 웜 브라운 헤드(`fill="#8B5E3C"`), 크림 밸리(`fill="#F4EAD5"`), 오렌지 부리(`fill="#E9A63C"`) SVG 벡터 경로 작성.
  - Framer-motion `animate` 속성으로 상태별 모션 분기 (jumping, waving, sleeping 💤, celebration confetti).
- **테스트 방법**: `Mascot` 컴포넌트 Props 전달 및 6가지 상태 렌더링 검증.
- **완료 조건**: 마스코트 `디딤이`가 6개 상태별로 생동감 있게 동작함.

---

### Phase 2 — Pixel Asset Rendering (`index.css` / `Furniture.tsx`)
**Dependency**: Phase 1

#### Task 2: Crisp Pixel Rendering CSS & Furniture.tsx 픽셀 아웃라인 적용
- **목적**: 픽셀 가구 및 마스코트가 흐릿해지지 않도록 CSS 렌더링을 격리하고 18종 가구 SVG에 Dark Brown Pixel Outline을 적용한다.
- **수정 파일**: `artifacts/jogak/src/index.css`, `artifacts/jogak/src/components/Furniture.tsx`
- **구체적 구현 내용**:
  - `index.css`에 `.pixel-art` 클래스 (`image-rendering: pixelated; shape-rendering: crispEdges;`) 추가.
  - `Furniture.tsx`에 18종 픽셀 소품 렌더러 분기 및 Dark Brown 픽셀 테두리 스트라이프 적용.
- **테스트 방법**: 레티나 모바일 화면에서 픽셀 가장자리 선명도 확인.
- **완료 조건**: 18종 가구 및 마스코트가 흐림 없이 선명하게 고해상도로 드로잉됨.

---

### Phase 3 — My Home Layered Room & Mascot Integration (`deco-room.tsx`)
**Dependency**: Phase 1, Phase 2

#### Task 3: My Studio Room 6개 레이어 체계 & 마스코트 상호작용 바인딩
- **목적**: Background ➔ Wall ➔ Window ➔ Furniture ➔ Decoration ➔ Mascot ➔ Foreground Z-index 레이어 구조 구축 및 마스코트 상호작용 연결.
- **수정 파일**: `artifacts/jogak/src/pages/deco-room.tsx`
- **구체적 구현 내용**:
  - Z-index 0~50 레이어 구조 명시적 분리.
  - 방 첫 진입 시 마스코트 `welcome` 포즈 발동, 저녁 시간대 `rest` 포즈 자동 전환.
  - 가구 추가 시 마스코트가 신규 가구 좌표 쪽으로 반응하는 인터랙션 연결.
- **테스트 방법**: `deco-room` 진입 후 마스코트 인사 및 가구 배치 반응 검증.
- **완료 조건**: 6개 레이어가 깔끔하게 쌓이고 마스코트가 방 안의 동반자로 존재함.

---

### Phase 4 — Reward Reveal & Celebration UX (`RewardClaimModal.tsx`)
**Dependency**: Phase 1, Phase 2

#### Task 4: 마스코트 축하 모션이 결합된 Reward Reveal 모달 고도화
- **목적**: 챌린지 완료 후 마스코트가 `celebrate` 포즈로 보상 소품을 머리 위에 들고 축하하는 감성 팝업 연출.
- **수정 파일**: `artifacts/jogak/src/components/RewardClaimModal.tsx`
- **구체적 구현 내용**:
  - `<Mascot state="celebrate" size="lg" />` 바인딩 및 픽셀 폭죽(Sparkles) 파티클 애니메이션 추가.
  - `[🏡 내 집에 바로 배치하기]` 클릭 시 `deco-room` 이동 + 마스코트 `happy` 인사 연결.
- **테스트 방법**: 챌린지 수행 완료 ➔ 보상 모달 마스코트 축하 모션 확인.
- **완료 조건**: 챌린지 완료 ➔ 마스코트 축하 ➔ 보상 공개 ➔ 즉시 배치의 완성도 높은 UX.

---

### Phase 5 — System Integration & Mobile Responsive Verification
**Dependency**: Phase 1 ~ 4

#### Task 5: 마스코트 적용 포인트 바인딩 & 모바일 검증
- **목적**: `reflection.tsx`, `growth.tsx`, `daily-checkin.tsx` 내 마스코트 적재적소 바인딩 및 모바일 반응형 검증.
- **수정 파일**: `artifacts/jogak/src/pages/reflection.tsx`, `artifacts/jogak/src/pages/growth.tsx`, `artifacts/jogak/src/components/MascotBadge.tsx`
- **구체적 구현 내용**:
  - 헤더 `MascotBadge`를 클릭하면 미니 대사 팝업("오늘도 내 속도대로 한 걸음!") 노출.
  - 모바일 뷰포트(375px~430px)에서 가구 및 마스코트 크기/터치 영역 최적화.
- **테스트 방법**: `verification-before-completion` 스킬 기반 빌드 및 E2E 모바일 뷰어 체크.
- **완료 조건**: 콘솔 에러 0개, 모바일 뷰포트 완벽 호환, 마스코트 인터랙션 100% 정상 작동.

---

## D. 위험요소 및 대응 방안 (Risk Management)

| 위험 요소 | 영향도 | 대응 방안 |
|---|---|---|
| **1. UI 전체가 픽셀화되는 오버디자인** | **HIGH** | `image-rendering: pixelated`는 `.pixel-art` 클래스 내부로 엄격 격리, UI 카드/글꼴에는 Modern 스타일 고수 |
| **2. 마스코트 렌더링 성능 지연** | **LOW** | Lottie/heavy GIF 대신 100% 경량 SVG + Framer-motion CSS transform 모션 적용으로 60fps 보장 |
| **3. 모바일 화면에서 아이템 겹침** | **MEDIUM** | 10x10 그리드에 `touch-action: none` 및 `CELL_SIZE` 비율 맞춤 계산 적용 |

---

## 📌 Phase별 추진 요약 (Executive Summary)

- **Phase 1 — Mascot Component**: 마스코트 `디딤이` 6가지 상태 컴포넌트(`Mascot.tsx`) 신설
- **Phase 2 — Pixel Asset Rendering**: `.pixel-art` CSS 및 18종 픽셀 가구 SVG 렌더러 개편
- **Phase 3 — My Home Layered Room**: 6개 레이어 룸 & 방 안 마스코트 동행 인터랙션 구축
- **Phase 4 — Reward Reveal UX**: 마스코트 `celebrate` 축하 연출 모달 완성
- **Phase 5 — System Integration**: 모바일 반응형 최적화 및 `verification-before-completion` 최종 검증
