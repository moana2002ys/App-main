import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { SignupBody, LoginBody, SaveStateBody } from "@workspace/api-zod";
import { db, usersTable, sessionsTable, type User } from "@workspace/db";

const router: IRouter = Router();

const SESSION_COOKIE = "jogak_session";
const SESSION_DAYS = 30;

function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

async function createSession(userId: number): Promise<string> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ token, userId, expiresAt });
  return token;
}

async function getSessionUser(req: Request): Promise<User | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token || typeof token !== "string") return null;

  const rows = await db
    .select({ user: usersTable, expiresAt: sessionsTable.expiresAt })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
    .where(eq(sessionsTable.token, token))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
    return null;
  }
  return row.user;
}

router.post("/auth/signup", async (req, res) => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "잘못된 요청이에요." });
  }
  const email = parsed.data.email.trim().toLowerCase();
  const { password } = parsed.data;

  if (!email.includes("@")) {
    return res.status(400).json({ message: "이메일 주소를 다시 확인해 주세요." });
  }
  if (password.length < 4) {
    return res.status(400).json({ message: "비밀번호는 4자 이상이면 돼요." });
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (existing.length > 0) {
    return res.status(409).json({ message: "이미 가입된 이메일이에요. 로그인해 볼까요?" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const inserted = await db
    .insert(usersTable)
    .values({ email, passwordHash })
    .returning({ id: usersTable.id });

  const token = await createSession(inserted[0].id);
  setSessionCookie(res, token);
  return res.json({ email, state: null });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "잘못된 요청이에요." });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  const user = rows[0];

  const ok = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!ok) {
    return res.status(401).json({ message: "이메일 또는 비밀번호가 맞지 않아요." });
  }

  const token = await createSession(user.id);
  setSessionCookie(res, token);
  return res.json({ email: user.email, state: user.state ?? null });
});

router.post("/auth/logout", async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token && typeof token === "string") {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  return res.status(204).end();
});

router.get("/auth/me", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ message: "로그인이 필요해요." });
  }
  return res.json({ email: user.email, state: user.state ?? null });
});

router.put("/state", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ message: "로그인이 필요해요." });
  }
  const parsed = SaveStateBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "잘못된 요청이에요." });
  }
  await db
    .update(usersTable)
    .set({ state: parsed.data.state })
    .where(eq(usersTable.id, user.id));
  return res.status(204).end();
});

export default router;
