// src/ui/NumberBaseball.tsx
import React, { useEffect, useMemo, useState } from "react";
import { judgeGuess, validateGuess, formatAttemptLine } from "../../type/numberBaseball";

export type NBResult = {
  guess: string;
  result: { strike: number; ball: number; out: number };
  historyLine: string; // "n. 2310 1S 2B 1O"
  win: boolean;        // strike == length
};

type Props = {
  open: boolean;
  length: number;          // 자리수(4/5/6)
  secret: string;          // 부모가 관리하는 시작값
  attemptIndex1: number;   // 1부터 시작하는 시도 번호(표기용)
  onClose: (res: NBResult | null) => void; // null이면 취소/닫기
  history: string[];
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
  width: 520,
  maxWidth: "90vw",
  background: "#1d1f24",
  color: "#fff",
  borderRadius: 12,
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
  padding: 16,
  border: "1px solid #2a2e36",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 12,
  fontWeight: 600,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: 8,
};

const numBtnStyle: React.CSSProperties = {
  padding: "10px 0",
  borderRadius: 8,
  border: "1px solid #2e3340",
  background: "#2a2f3b",
  cursor: "pointer",
  textAlign: "center",
  fontSize: 18,
  userSelect: "none" as const,
};

const numBtnDisabled: React.CSSProperties = {
  ...numBtnStyle,
  opacity: 0.35,
  cursor: "not-allowed",
  filter: "grayscale(0.8)",
};

const slotsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  margin: "12px 0",
  justifyContent: "center",
};

const slotStyle: React.CSSProperties = {
  width: 48,
  height: 64,
  borderRadius: 10,
  border: "2px dashed #3a4050",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  background: "#0f1217",
  cursor: "pointer",
};

const footStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 12,
  justifyContent: "flex-end",
};

const winMessageStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #0a4a0a 0%, #0a2a0a 100%)",
  border: "2px solid #00ff00",
  borderRadius: 8,
  padding: "16px",
  margin: "12px 0",
  textAlign: "center",
  color: "#00ff00",
  fontSize: "20px",
  fontWeight: "bold",
  textShadow: "0 0 10px rgba(0, 255, 0, 0.8)",
  animation: "winPulse 1s ease-in-out infinite",
};

export default function NumberBaseball({
  open,
  length,
  secret,
  attemptIndex1,
  onClose,
}: Props) {
  const [picked, setPicked] = useState<string[]>([]);
  const [showWinMessage, setShowWinMessage] = useState(false);
  const canSubmit = picked.length === length;

  useEffect(() => {
    if (!open) {
      setPicked([]);
      setShowWinMessage(false);
    }
  }, [open, length]);

  const usedSet = useMemo(() => new Set(picked), [picked]);

  const addDigit = (d: string) => {
    if (picked.length >= length) return;
    if (usedSet.has(d)) return;
    setPicked((prev) => [...prev, d]);
  };

  const removeAt = (idx: number) => {
    setPicked((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearAll = () => setPicked([]);

  const submit = () => {
    const guess = picked.join("");
    const err = validateGuess(guess, length);
    if (err) {
      alert(err);
      return;
    }
    const result = judgeGuess(guess, secret);
    const historyLine = formatAttemptLine(attemptIndex1, guess, result);

    const win = result.strike === length;
    
    if (win) {
      setShowWinMessage(true);
      // 1.5초 후 자동으로 닫기
      setTimeout(() => {
        onClose({ guess, result, historyLine, win });
      }, 1500);
    } else {
      onClose({ guess, result, historyLine, win });
    }
  };

  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle} role="dialog" aria-modal="true">
        <div style={headerStyle}>
          <div>숫자야구 — {length}자리 (중복없음, 선행 0 허용)</div>
          <button
            onClick={() => onClose(null)}
            style={{ background: "transparent", color: "#aaa", border: 0, fontSize: 18, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {/* 승리 메시지 */}
        {showWinMessage && (
          <div style={winMessageStyle}>
            🎉 정답입니다! ESCAPE! 🎉
          </div>
        )}

        {/* 선택 슬롯 */}
        <div style={slotsStyle}>
          {Array.from({ length }).map((_, i) => (
            <div
              key={i}
              style={slotStyle}
              title={picked[i] ? "클릭하면 제거" : "첫 빈칸부터 채워짐"}
              onClick={() => picked[i] && removeAt(i)}
            >
              {picked[i] ?? ""}
            </div>
          ))}
        </div>

        {/* 숫자 키패드 */}
        <div style={gridStyle}>
          {Array.from({ length: 10 }, (_, i) => String(i)).map((d) => {
            const disabled = usedSet.has(d) || picked.length >= length;
            return (
              <button
                key={d}
                style={disabled ? numBtnDisabled : numBtnStyle}
                disabled={disabled}
                onClick={() => addDigit(d)}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* 풋터 */}
        <div style={footStyle}>
          <button onClick={clearAll} style={{ ...numBtnStyle, padding: "10px 16px" }}>
            전체 지우기
          </button>
          <button
            onClick={submit}
            style={{
              ...numBtnStyle,
              padding: "10px 16px",
              background: canSubmit ? "#3b82f6" : "#2a2f3b",
              borderColor: canSubmit ? "#3b82f6" : "#2e3340",
            }}
            disabled={!canSubmit}
          >
            제출
          </button>
        </div>
      </div>

      <style>{`
        @keyframes winPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.6);
          }
          50% {
            box-shadow: 0 0 40px rgba(0, 255, 0, 1);
          }
        }
      `}</style>
    </div>
  );
}