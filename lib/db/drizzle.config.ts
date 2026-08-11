import { defineConfig } from "drizzle-kit";
import path from "path";

// 로컬 개발: 환경변수가 없으면 저장소 루트 .env에서 읽는다 (Replit은 직접 주입했음)
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(path.join(__dirname, "../../.env"));
  } catch {
    // .env가 없으면 아래 검사에서 안내
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL이 없습니다. 저장소 루트에서 `cp .env.example .env` 후 다시 실행하세요.",
  );
}

export default defineConfig({
  // Windows에서 역슬래시 경로는 drizzle-kit의 glob 매칭에 걸리지 않는다 → 슬래시로 통일
  schema: path.join(__dirname, "./src/schema/index.ts").replace(/\\/g, "/"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
