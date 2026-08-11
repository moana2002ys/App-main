// 로컬 개발용 내장 Postgres — 설치 없이 `pnpm --filter @workspace/scripts dev-db`로 뜬다.
//
// 배경: 이 저장소는 Replit에서 DATABASE_URL을 주입받아 돌았다. 로컬로 옮기면서
// 각자 Postgres를 설치/가입하는 대신, npm이 받아주는 내장 바이너리로 통일한다.
// 데이터는 저장소 루트 `.devdb/`(gitignore)에 남아 재시작해도 유지된다.
//
// 사용법:
//   1) 이 프로세스를 켜둔 채로            → postgresql://postgres:postgres@127.0.0.1:5502/jogak
//   2) 최초 1회 스키마 반영               → pnpm --filter @workspace/db push
//   3) .env 의 DATABASE_URL 을 위 주소로  → api-server 가 그대로 붙는다
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, "../../.devdb/data");
const PORT = 5502;
const DB_NAME = "jogak";

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true,
});

const firstRun = !existsSync(dataDir);

async function main() {
  if (firstRun) {
    console.log(`[dev-db] 최초 실행 — ${dataDir} 초기화 중...`);
    await pg.initialise();
  }
  await pg.start();
  if (firstRun) {
    await pg.createDatabase(DB_NAME);
  }
  console.log(`[dev-db] 실행 중: postgresql://postgres:postgres@127.0.0.1:${PORT}/${DB_NAME}`);
  console.log("[dev-db] 끝내려면 Ctrl+C");
}

async function shutdown() {
  console.log("\n[dev-db] 종료 중...");
  try {
    await pg.stop();
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch(async (err) => {
  console.error("[dev-db] 시작 실패:", err);
  try {
    await pg.stop();
  } catch {
    // 이미 죽어 있으면 무시
  }
  process.exit(1);
});
