# App-main React 이관 & 스텝바이스탭 통합 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port local StepByStep features (pixel isometric canvas engine, EXIF-free photo light shards, SDT Autonomy Level A0~A4, B2G recovery report page) into `App-main/artifacts/jogak` React TypeScript codebase.

**Architecture:** Create modular TSX components (`IsoCanvas.tsx`, `PhotoUploadModal.tsx`), utility libs (`pixel-engine.ts`, `photo-processor.ts`), new page (`recovery-report.tsx`), and integrate into `@/lib/store.ts` and `App.tsx`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide React, Wouter, Vite.

**Spec:** `App-main/docs/superpowers/specs/2026-09-02-app-main-integration-design.md`

## Global Constraints
- Target directory: `c:\Users\정민\Downloads\조각조각_사진인증_프로토타입\App-main\artifacts\jogak`
- App Name: 스텝바이스탭 (StepByStep)
- Mascot Name: 디딤이
- Preserve existing team components (`Onboarding`, `DailyCheckin`, `Home`, `DecoRoom`) without breaking.

---

### Task 1: Create Photo Processor & Pixel Engine Libraries in React Monorepo

**Files:**
- Create: `App-main/artifacts/jogak/src/lib/photo-processor.ts`
- Create: `App-main/artifacts/jogak/src/lib/pixel-engine.ts`

- [ ] **Step 1: Create photo-processor.ts for EXIF removal and canvas filter**
Implement `cleanAndCompressPhoto(file: File, blur: boolean): Promise<string>` using HTML5 Canvas.

- [ ] **Step 2: Port pixel-renderers.js logic to TypeScript module pixel-engine.ts**
Export `renderIsoScene(ctx: CanvasRenderingContext2D, spaceKey: string)` with room, door, front, town, city pixel tiles.

---

### Task 2: Create React Components (IsoCanvas & PhotoUploadModal)

**Files:**
- Create: `App-main/artifacts/jogak/src/components/IsoCanvas.tsx`
- Create: `App-main/artifacts/jogak/src/components/PhotoUploadModal.tsx`
- Create: `App-main/artifacts/jogak/src/components/MascotBadge.tsx`

- [ ] **Step 1: Implement MascotBadge.tsx**
Render mascot badge component with mascot name '디딤이' (🌙).

- [ ] **Step 2: Implement IsoCanvas.tsx using useRef & useEffect**
Render 160x152 scaled pixel canvas using `renderIsoScene`.

- [ ] **Step 3: Implement PhotoUploadModal.tsx**
Modal for adding actions with optional photo attachment, EXIF stripping, and light shard calculation.

---

### Task 3: Create Recovery Report Page & Update Store / App Routing

**Files:**
- Create: `App-main/artifacts/jogak/src/pages/recovery-report.tsx`
- Modify: `App-main/artifacts/jogak/src/lib/store.ts`
- Modify: `App-main/artifacts/jogak/src/App.tsx`

- [ ] **Step 1: Update store.ts for View type and recovery report stats**
Add `'recovery_report'` to View type and add helper for calculating SDT Autonomy Level (A0~A4).

- [ ] **Step 2: Create recovery-report.tsx**
Page displaying SDT Autonomy Level badge, recovery stats grid, and B2G agency pitch card for 서울 기지개 센터 / 안 무서운 회사.

- [ ] **Step 3: Add route in App.tsx**
Add `{view === 'recovery_report' && <RecoveryReport />}` to `MainFlow`.

---

### Task 4: Integration Verification & Build Check

- [ ] **Step 1: Run pnpm build / vite build in artifacts/jogak**
Verify TypeScript compilation and bundle success.
