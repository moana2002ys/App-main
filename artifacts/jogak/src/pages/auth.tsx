import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// 데모용 인메모리 계정 저장소 (새로고침 시 초기화)
const accounts = new Map<string, string>();

export function Auth() {
  const { updateUser, setView } = useAppStore();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const finish = (userEmail: string) => {
    updateUser({ email: userEmail });
    setView("onboarding");
  };

  const handleSubmit = () => {
    setError(null);
    const trimmed = email.trim();

    if (!trimmed || !trimmed.includes("@")) {
      setError("이메일 주소를 다시 확인해 주세요.");
      return;
    }
    if (password.length < 4) {
      setError("비밀번호는 4자 이상이면 돼요.");
      return;
    }

    if (mode === 'signup') {
      if (password !== confirm) {
        setError("비밀번호가 서로 달라요. 다시 확인해 주세요.");
        return;
      }
      if (accounts.has(trimmed)) {
        setError("이미 가입된 이메일이에요. 로그인해 볼까요?");
        return;
      }
      accounts.set(trimmed, password);
      finish(trimmed);
    } else {
      const saved = accounts.get(trimmed);
      if (!saved || saved !== password) {
        setError("이메일 또는 비밀번호가 맞지 않아요.");
        return;
      }
      finish(trimmed);
    }
  };

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m);
    setError(null);
    setConfirm("");
  };

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <Character size="sm" showItems={false} />
          <div className="space-y-1">
            <h1 className="text-2xl font-medium text-foreground">조각조각</h1>
            <p className="text-sm text-muted-foreground">하루에 하나, 작은 조각을 모아가요</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-border/50 p-6 space-y-5">
          <div className="flex bg-secondary/50 rounded-2xl p-1">
            {([['signup', '회원가입'], ['login', '로그인']] as const).map(([m, label]) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  mode === m ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="이메일"
                className="w-full bg-secondary/30 rounded-2xl px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="w-full bg-secondary/30 rounded-2xl px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {mode === 'signup' && (
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="비밀번호 확인"
                  className="w-full bg-secondary/30 rounded-2xl px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive text-center"
            >
              {error}
            </motion.p>
          )}

          <Button size="lg" className="w-full rounded-2xl h-14" onClick={handleSubmit}>
            {mode === 'signup' ? '가입하고 시작하기' : '로그인'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          데모 버전이라 새로고침하면 계정이 초기화돼요.
        </p>
      </div>
    </div>
  );
}
