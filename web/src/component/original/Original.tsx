// Original.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

type Mode = "normal" | "hard";

type HistoryItem = {
  guess: string;
  strikes: number;
  balls: number;
  out: boolean;
};

const MAX_ATTEMPTS = 9;

const Original: React.FC = () => {
  const [mode, setMode] = useState<Mode>("normal"); // normal=3자리, hard=4자리
  const digits = useMemo(() => (mode === "normal" ? 3 : 4), [mode]);

  const [secret, setSecret] = useState<string>("");
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState<"win" | "lose" | null>(null);
  const [status, setStatus] = useState<string>("상태: 준비됨");
  const [guess, setGuess] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [attempt, setAttempt] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const generateSecret = useCallback((n: number) => {
    // 0~9에서 중복 없이 n자리 생성 (선행 0 허용)
    const nums = Array.from({ length: 10 }, (_, i) => String(i));
    const pick: string[] = [];
    while (pick.length < n) {
      const i = Math.floor(Math.random() * nums.length);
      const c = nums.splice(i, 1)[0];
      pick.push(c);
    }
    return pick.join("");
  }, []);

  const resetGame = useCallback(
    (keepMode = true) => {
      void keepMode;
      const s = generateSecret(digits);
      setSecret(s);
      setStarted(true);
      setFinished(null);
      setGuess("");
      setHistory([]);
      setAttempt(0);
      setStatus(`상태: 게임 시작! (${digits}자리 / 중복 없음 / ${MAX_ATTEMPTS}회)`);
      // console.debug("SECRET:", s); // 디버깅 시 활성화
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [digits, generateSecret]
  );

  // 모드 변경 시, 진행 중이면 새 게임으로 리셋
  useEffect(() => {
    if (started) resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleStart = () => {
    resetGame();
  };

  const handleReset = () => {
    setStarted(false);
    setFinished(null);
    setHistory([]);
    setAttempt(0);
    setGuess("");
    setStatus("상태: 준비됨");
  };

  const validateGuess = (value: string): string | null => {
    if (value.length !== digits) return `${digits}자리 숫자를 입력하세요.`;
    if (!/^\d+$/.test(value)) return "숫자만 입력하세요.";
    // 중복 금지
    const set = new Set(value.split(""));
    if (set.size !== value.length) return "중복 없는 숫자를 입력하세요.";
    return null;
  };

  const judge = (secret: string, g: string) => {
    let strikes = 0;
    let balls = 0;
    for (let i = 0; i < g.length; i++) {
      if (g[i] === secret[i]) strikes++;
      else if (secret.includes(g[i])) balls++;
    }
    const out = strikes === 0 && balls === 0; // 무한도전 룰: 하나도 맞추지 못하면 아웃
    return { strikes, balls, out };
  };

  const submitGuess = () => {
    if (!started || finished) return;
    const err = validateGuess(guess);
    if (err) {
      setStatus(`상태: ${err}`);
      inputRef.current?.focus();
      return;
    }

    const { strikes, balls, out } = judge(secret, guess);
    const nextItem: HistoryItem = { guess, strikes, balls, out };

    const nextAttempt = attempt + 1;
    const newHistory = [nextItem, ...history];
    setHistory(newHistory);
    setAttempt(nextAttempt);

    if (strikes === digits) {
      setFinished("win");
      setStatus(`상태: 🎉 정답! ${nextAttempt}회 만에 맞췄습니다.`);
    } else if (nextAttempt >= MAX_ATTEMPTS) {
      setFinished("lose");
      setStatus(`상태: 😵 실패! 정답은 ${secret}였습니다.`);
    } else {
      if (out) setStatus(`상태: OUT! (시도 ${nextAttempt}/${MAX_ATTEMPTS})`);
      else setStatus(`상태: ${strikes}S ${balls}B (시도 ${nextAttempt}/${MAX_ATTEMPTS})`);
    }

    setGuess("");
    inputRef.current?.focus();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") submitGuess();
  };

  return (
    <div className="app">
      <Link to="/">메인 페이지로</Link>
      <div className="card">
        <header className="header">
          <h1>숫자야구 (무한도전 룰)</h1>
          <span className="badge">
            {mode === "normal" ? "일반: 3자리" : "하드: 4자리"} · 9이닝
          </span>
        </header>

        <section className="controls">
          <div className="field">
            <label htmlFor="mode">모드</label>
            <select
              id="mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              disabled={started && !finished}
            >
              <option value="normal">일반 (3자리)</option>
              <option value="hard">하드 (4자리)</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="guess">
              입력{" "}
              <small style={{ color: "#94a3b8" }}>
                ({digits}자리 / 중복X / Enter 제출)
              </small>
            </label>
            <input
              id="guess"
              ref={inputRef}
              type="text"
              placeholder={digits === 3 ? "예: 123" : "예: 1234"}
              value={guess}
              onChange={(e) => setGuess(e.target.value.trim())}
              onKeyDown={handleKeyDown}
              disabled={!started || !!finished}
              maxLength={digits}
            />
          </div>

          {!started || finished ? (
            <button className="btn primary" onClick={handleStart}>
              시작
            </button>
          ) : (
            <button className="btn primary" onClick={submitGuess}>
              제출
            </button>
          )}

          <button className="btn ghost" onClick={handleReset}>
            리셋
          </button>
        </section>

        <div className="status">
          <span className="dot" />
          <span>{status}</span>
        </div>

        <section className="history">
          <div className="history-head">
            <strong>기록</strong>{" "}
            <small style={{ color: "#94a3b8" }}>
              (최근 순)
            </small>
          </div>
          {history.length === 0 ? (
            <ul className="history-list">
              <li className="history-item">아직 기록이 없습니다.</li>
            </ul>
          ) : (
            <ul className="history-list">
              {history.map((h, idx) => (
                <li key={idx} className="history-item">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>
                      <strong>{h.guess}</strong>
                    </span>
                    <span>
                      {h.out ? (
                        <span style={{ color: "var(--danger)", fontWeight: 700 }}>OUT</span>
                      ) : (
                        <>
                          <span style={{ color: "var(--success)", fontWeight: 700 }}>
                            {h.strikes}S
                          </span>{" "}
                          <span style={{ color: "var(--warn)", fontWeight: 700 }}>
                            {h.balls}B
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 원본 CSS 인라인 유지 */}
      <style>{`
:root {
  --bg: #0f172a; /* slate-900 */
  --panel: #111827; /* gray-900 */
  --muted: #374151; /* gray-700 */
  --text: #e5e7eb; /* gray-200 */
  --accent: #22d3ee; /* cyan-400 */
  --accent-2: #38bdf8; /* sky-400 */
  --danger: #f87171; /* red-400 */
  --success: #34d399; /* emerald-400 */
  --warn: #fbbf24; /* amber-400 */
  --shadow: 0 10px 30px rgba(0,0,0,.35);
  --radius: 18px;
}
* { box-sizing: border-box; }
html, body, #root { height: 100%; }
body {
  margin: 0; background: radial-gradient(1200px 600px at 70% -10%, #1e293b 0%, var(--bg) 60%);
  color: var(--text); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans KR, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji;
  display: grid; place-items: center; padding: 24px;
}
.app { width: min(840px, 100%); }
.card {
  background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: clip;
}
.header {
  padding: 24px 24px 12px; display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  background: linear-gradient(180deg, rgba(56,189,248,0.08), rgba(34,211,238,0.06));
}
h1 { margin: 0; font-size: 22px; letter-spacing: .3px; }
.badge { font-size: 12px; padding: 4px 8px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); }

.controls { display: grid; gap: 12px; grid-template-columns: 140px 1fr 120px 120px; padding: 16px 24px; }
.controls .field { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 12px; color: #cbd5e1; }
select, input[type="text"] {
  height: 44px; padding: 0 12px; border-radius: 12px;
  background: #0b1220; color: var(--text); border: 1px solid rgba(255,255,255,0.08);
  outline: none; transition: border-color .2s, box-shadow .2s;
}
select:focus, input[type="text"]:focus { border-color: var(--accent-2); box-shadow: 0 0 0 3px rgba(56,189,248,0.25); }
.btn { height: 44px; border-radius: 12px; border: 0; color: #06121a; font-weight: 700; cursor: pointer; }
.btn.primary { background: linear-gradient(90deg, var(--accent), var(--accent-2)); }
.btn.ghost { background: transparent; color: var(--text); border: 1px solid rgba(255,255,255,0.12); }

.status { display: flex; gap: 12px; align-items: center; padding: 0 24px 16px; color: #cbd5e1; font-size: 14px; }
.status .dot { width: 10px; height: 10px; border-radius: 999px; background: var(--accent-2); box-shadow: 0 0 12px var(--accent-2); }

.history { padding: 16px 24px; }
.history-head { color: #cbd5e1; margin-bottom: 8px; }
.history-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.history-item {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 10px 12px;
}
      `}</style>
    </div>
  );
};

export default Original;
