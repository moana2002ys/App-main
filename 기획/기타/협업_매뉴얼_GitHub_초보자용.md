# 조각조각 팀 — GitHub 협업 매뉴얼 (초보자용, Mac + Windows)

_레포: https://github.com/moana4growth/Moana4growth · 작업자 3명(노트북 3대), Claude·GitHub 공용 계정 사용_
_🍎 = macOS, 🪟 = Windows. 명령어는 대부분 같고, **다른 부분만 🪟로 따로** 표기했습니다._

> **3줄 요약**
> 1. (한 번만) 내 노트북에 레포를 **clone**해서 "작업 폴더"를 만든다.
> 2. 작업 전 항상 **`git pull`**(최신 받기) → Claude Code로 md 수정 → **commit → push**(올리기).
> 3. 헷갈리면 Claude Code에게 "최신으로 받아줘 / 커밋하고 올려줘"라고 시키면 대신 해준다.

---

## 용어 3개만 먼저 (이것만 알면 됨)
- **clone(클론)**: GitHub에 있는 레포를 내 노트북으로 통째로 복사해 오는 것. (최초 1회)
- **pull(풀)**: 남들이 올린 최신 변경을 내 노트북으로 받아오는 것. (작업 시작 전)
- **commit(커밋) → push(푸시)**: 내 수정을 "저장 도장" 찍고(commit) → GitHub에 올리는 것(push). (작업 끝나고)

동네 도서관에 비유하면: clone = 책 빌려오기, pull = 최신판으로 갱신, commit = 내 메모 정리, push = 도서관에 반영.

---

## PART 0. GitHub 웹에서 먼저 할 설정 (레포 관리자 1명이 한 번)

레포는 만들어져 있으니, 웹(github.com)에서 아래만 해두면 협업이 매끄럽습니다.
1. **README 추가**: 레포 첫 화면 → "Add a README" → 커밋. (레포에 파일이 하나는 있어야 clone이 깔끔)
2. **collaborator 초대(권장)**: 레포 → **Settings → Collaborators → Add people** → 팀원 GitHub 계정 초대. (공용 계정만 쓸 거면 생략 가능하나, 각자 계정 초대가 정석)
3. **기본 브랜치 확인**: Settings → General → Default branch = `main`인지 확인.
4. (선택) **main 보호**: Settings → Branches → Add rule → `main`에 "Require a pull request before merging" 체크. 실수로 main에 바로 push하는 걸 막고 싶을 때. 초보 팀은 처음엔 생략해도 됨.
5. (자동 생성) `.gitignore`는 우리가 로컬에서 넣을 거예요(PART 7).

---

## PART 1. 최초 1회 세팅 (노트북마다 딱 한 번)

### 1-1. 명령창 열기
- 🍎 `Command(⌘) + Space` → "터미널" 입력 → 실행.
- 🪟 시작 메뉴 → "PowerShell" 실행. (또는 Git 설치 후 "Git Bash" — 아래 명령이 Mac과 거의 동일해짐)

### 1-2. git 있는지 확인 / 설치
```bash
git --version
```
- 🍎 버전이 나오면 OK. "설치하겠냐"는 창이 뜨면 **설치**(Xcode 도구).
- 🪟 "인식할 수 없다"는 오류면 → https://git-scm.com/download/win 에서 **Git for Windows** 설치(계속 Next). 설치 중 "Git Bash" 포함됨. 설치 후 PowerShell/Git Bash 다시 열기.

### 1-3. GitHub 로그인 (gh CLI 권장)
GitHub CLI가 로그인을 브라우저로 쉽게 처리해줍니다.

🍎 **macOS:**
```bash
# (1) Homebrew 없으면 먼저 설치 — 이미 있으면 건너뜀
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# (2) gh 설치
brew install gh
# (3) 로그인 (공용 GitHub 계정으로)
gh auth login
```

🪟 **Windows (PowerShell):**
```powershell
winget install --id GitHub.cli
# PowerShell 창을 닫았다 다시 연 뒤:
gh auth login
```
(winget이 없으면 https://cli.github.com 에서 설치 파일 다운로드)
`gh auth login` 진행 시 이렇게 고르세요:
- **GitHub.com** 선택
- **HTTPS** 선택
- "Authenticate Git with your GitHub credentials?" → **Yes**
- **Login with a web browser** 선택 → 뜨는 **한 번 쓰는 코드**를 복사 → 브라우저에서 공용 계정으로 로그인 → 코드 붙여넣기 → 승인

> 💡 브라우저 로그인이 어려우면 대안: GitHub 사이트에서 **Personal Access Token(PAT)** 발급 후, 아래 clone 때 비밀번호 자리에 PAT을 붙여넣으면 됩니다(맥이 자동 기억). PART 6 참고.

### 1-4. "내 이름" 설정 (누가 고쳤는지 남기려면 꼭!)
공용 계정이라도 이걸 하면 **커밋 기록에 내 이름이 찍힙니다.** 본인 것으로:
```bash
git config --global user.name "홍길동"
git config --global user.email "hong@example.com"
```

### 1-5. 레포 clone (= 작업 폴더 만들기)
원하는 위치(예: 문서 폴더)로 이동해서 복제합니다.

🍎 **macOS:**
```bash
cd ~/Documents
git clone https://github.com/moana4growth/Moana4growth.git
```
🪟 **Windows (PowerShell):**
```powershell
cd ~\Documents
git clone https://github.com/moana4growth/Moana4growth.git
```
- 끝나면 `Documents/Moana4growth` 폴더가 생깁니다. **이 폴더가 곧 GitHub와 연결된 작업 폴더**예요(따로 연결 작업 불필요, clone이 연결까지 해줌).

### 1-6. Claude Code로 그 폴더 열기
```bash
cd ~/Documents/Moana4growth
claude
```
- 이제 이 폴더 안의 md를 Claude Code로 수정하면 됩니다.

✅ **여기까지가 세팅 끝. 1-5까지는 노트북마다 한 번만 하면 됩니다.**

---

## PART 2. 매일 작업 흐름 (제일 중요 — 이것만 반복)

_🪟 Windows도 아래 명령 그대로 씁니다(PowerShell/Git Bash 모두 `git ...` 동일, 경로도 `cd ~/Documents/...` 그대로 작동)._

### ① 시작할 때: 최신 받기
```bash
cd ~/Documents/Moana4growth
git pull
```
> Claude Code에게: **"최신으로 pull 해줘"** 라고 해도 됨.

### ② 수정하기
- Claude Code로 md 파일을 편집. (평소처럼 대화하며 고치면 됨)

### ③ 끝나면: 올리기
```bash
git add -A
git commit -m "무엇을 바꿨는지 한 줄 (예: 설계명세 계획량 부분 수정)"
git push
```
> Claude Code에게: **"방금 수정한 거 커밋하고 push 해줘"** 라고 하면 위 3줄을 대신 해줍니다.
> `-m` 뒤 메시지는 나중에 "누가 뭘 왜 바꿨나" 알아보는 기록이니 짧게라도 쓰세요.

### 반복
다음에 또 작업할 때 **①부터** 다시. (항상 pull로 시작, push로 마무리)

---

## PART 3. 3명이 겹치지 않게 쓰는 규칙 (충돌 예방)

같은 파일을 두 명이 동시에 고치면 "충돌(conflict)"이 납니다. 아래만 지키면 거의 안 나요:
1. **작업 전 항상 `git pull`.** (남이 올린 걸 먼저 받기)
2. **파일/구역을 나눠서** 작업. 예: A=명세, B=레퍼런스, C=전체개요.
3. **작게 자주 push.** 한 번에 몰아서 하지 말고, 한 구간 끝나면 바로 commit·push.
4. 같은 파일을 꼭 같이 만져야 하면, 슬랙 등으로 "나 지금 이 파일 작업 중"이라고 한마디.

---

## PART 4. 충돌(conflict)이 났을 때 — 당황 금지

`git pull`이나 `git push` 때 "conflict" 또는 "merge" 메시지가 나오면:
1. **그대로 멈추고** Claude Code에게: **"충돌 났어. 해결해줘"** 라고 하세요. 파일을 열어 어느 부분이 부딪혔는지 보고 정리해줍니다.
2. 직접 하려면: 충돌 파일에 `<<<<<<<`, `=======`, `>>>>>>>` 표시가 생깁니다. 그 사이에서 남길 내용만 남기고 표시들을 지운 뒤:
   ```bash
   git add -A
   git commit -m "충돌 해결"
   git push
   ```
> 겁먹지 마세요. 커밋 전 상태는 되돌릴 수 있고, push 전이라 GitHub에는 아직 영향 없습니다.

---

## PART 5. 자주 쓰는 명령어 치트시트

| 하고 싶은 것 | 명령어 |
|---|---|
| 작업 폴더로 이동 | `cd ~/Documents/Moana4growth` |
| 최신 받기 | `git pull` |
| 지금 상태 보기(뭐 바뀌었나) | `git status` |
| 전부 저장 도장 | `git add -A` |
| 커밋(메시지 필수) | `git commit -m "메시지"` |
| GitHub에 올리기 | `git push` |
| 최근 기록 보기 | `git log --oneline -10` |

> 명령어 외우기 부담되면: **"pull 해줘 / 커밋하고 올려줘 / 지금 상태 알려줘"**를 Claude Code에게 말로 시키면 됩니다.

---

## PART 6. 문제 해결 FAQ

- **push 할 때 자꾸 로그인/권한 오류가 나요**
  → `gh auth login`을 다시 하거나(1-3), 공용 계정이 이 레포의 권한이 있는지 확인. 대안으로 PAT 사용:
  GitHub 웹 → 우상단 프로필 → Settings → Developer settings → Personal access tokens → **Fine-grained token** 발급(레포 접근 권한 부여) → clone/push 시 비밀번호 자리에 붙여넣기.

- **`git push`가 거부돼요(rejected, "fetch first")**
  → 남이 먼저 올린 게 있다는 뜻. `git pull` 하고 다시 `git push`.

- **실수로 이상하게 바꿨어요 / 되돌리고 싶어요**
  → 아직 commit 안 했으면: `git restore 파일명` (그 파일 원상복구). 전체는 `git restore .`
  → 헷갈리면 Claude Code에게 "방금 바꾼 거 되돌려줘"라고 하세요.

- **폴더가 GitHub와 연결됐는지 확인**
  → `git remote -v` 실행 → `origin  https://github.com/moana4growth/Moana4growth.git` 가 보이면 연결됨.

- **2단계 인증(2FA) 때문에 막혀요**
  → 공용 계정에 2FA가 켜져 있으면 각자 로그인 시 인증수단이 필요합니다. 팀에서 PAT 방식(위)으로 통일하면 편합니다.

---

## PART 7. 모아나 프로젝트(앱 + 설계문서) 레포로 이전하기

_이 작업은 관리자 1명이 자기 노트북에서 한 번만 하면 되고, 이후 팀은 clone만 하면 됩니다. 헷갈리면 Claude Code에게 "이거 레포에 넣게 정리해줘"라고 시키세요._

### 무엇을 넣나 — 2가지: (A) 앱 코드, (B) 설계 문서

**(A) 앱 코드** — 소스: `moana-peurojegteu (1).zip`(최신본). 압축 풀면 pnpm 모노레포입니다.
- ✅ **넣을 것:**
  - `artifacts/` — 앱 본체. 특히 `jogak/`(classifier.ts · daily-checkin.tsx · home.tsx), `api-server/`(challenges.ts), `deco-lab/`, `mockup-sandbox/`
  - `lib/` — 공용 라이브러리(api-client-react · api-spec · api-zod · db)
  - `scripts/`
  - 루트 설정: `package.json` · `pnpm-lock.yaml` · `pnpm-workspace.yaml` · `tsconfig.json` · `tsconfig.base.json` · `.replit` · `replit.md` · `.npmrc` · `.gitignore`
- ❌ **넣지 말 것(중요):**
  - `node_modules/` (엄청 큼, 재설치로 복구됨) · `.local/` (Replit 스킬 캐시, 매우 큼) · `dist/`·빌드 산출물 · `.git/` · **모든 `.zip`**
  - → 이걸 안 빼면 push가 느리거나 실패합니다(GitHub 파일 100MB 제한).

**(B) 설계 문서** — 소스: `[경험확장 앱]/md 파일/`. 레포의 `docs/` 폴더로:
- `조각조각_BA사이클_설계명세_v2.md`(v2.3) · `온보딩_설계_Part1-2.md` · `조각조각_사이클_전체개요_팀공유.md` · `BA_앱_레퍼런스_비교.md` · `협업_매뉴얼_GitHub_초보자용.md`(이 문서)
- `character_reward_design.md` · `mission-bank-v2.md` · `미션뱅크_DB_심화판.md` · `0720_알고리즘_v2_BA사이클.md` · `algorithm.md`
- `diagrams/`(PNG 3장)
- (선택) `.docx`는 안 올려도 됨(md가 원본). reference PDF는 용량 크면 GitHub 대신 Drive 권장.

### 권장 폴더 구조
```
Moana4growth/
├─ artifacts/        (앱)
├─ lib/              (앱)
├─ scripts/
├─ package.json, pnpm-*.yaml, tsconfig*.json, .replit, replit.md
├─ docs/             ← 설계 md 전부 + diagrams/
├─ README.md
└─ .gitignore
```

### .gitignore (레포 루트에 이 내용으로)
```
node_modules/
.local/
dist/
build/
*.zip
.DS_Store
*.log
.env
```

### 첫 업로드 명령 (관리자 노트북에서)
```bash
cd ~/Documents/Moana4growth        # clone해둔 폴더
# (여기로 위 (A)앱 파일과 (B)docs 폴더를 복사해 넣는다)
git add -A
git commit -m "초기: 앱 코드 + 설계 문서 이전"
git push
```
> 💡 파일 복사·`.gitignore` 작성·첫 커밋까지 **Claude Code에게 맡기면** 실수 없이 한 번에 해줍니다. (이 `[경험확장 앱]` 폴더에서 Claude Code에게 "md 파일 폴더 문서들과 moana 앱 코드를 Moana4growth clone 폴더로 정리해서 넣고 첫 커밋해줘"라고 지시)

### 이전 후
- 팀원 2명은 PART 1대로 **clone만** 하면 앱+문서 전부 받아집니다.
- 앱 실행하려면 각자 `pnpm install`(node_modules 재생성). 자세한 실행법은 `replit.md` 참고.

---

## (참고) 더 깔끔한 대안
지금은 공용 GitHub 계정으로 진행하지만, 여유되면 **각자 본인 GitHub 계정**을 만들어 `moana4growth` 레포에 **collaborator로 초대**하는 게 정석입니다(누가 뭘 했는지 정확히 남고, 로그인도 각자, 약관도 OK). 초대: 레포 → Settings → Collaborators → Add people.
