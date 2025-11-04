import React, { useEffect, useMemo, useState } from "react";
import { judgeGuess, validateGuess, formatAttemptLine } from "../../type/numberBaseball";

export type NBResult = {
  win: boolean; // 전부 정답이면 true
  guess: string;
  result: { strike: number; ball: number; out: number };
  // 한 번만 제출하므로 history는 이 한 줄만 반환(부모가 누적 저장)
  historyLine: string;
};

type Props = {
  open: boolean;
  length: number;         // 4/5/6
  secret: string;         // 부모 제공(시작값)
  attemptIndex1: number;  // 몇 번째 시도였는지(부모에서 1부터 카운트)
  onClose: (res: NBResult | null) => void; // null이면 취소(닫기)
};

export default function NumberBaseballModal({ open, length, secret, attemptIndex1, onClose }: Props) {
  const [slots, setSlots] = useState<(string | null)[]>(() => Array.from({ length }, () => null));
  const [disabled, setDisabled] = useState<boolean[]>(() => Array(10).fill(false));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    // 모달 열릴 때 초기화
    setSlots(Array.from({ length }, () => null));
    setDisabled(Array(10).fill(false));
    setSubmitting(false);
    // ESC로 닫기 (원하면 막아도 됨)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, length, onClose]);

  const current = useMemo(() => (slots.every(s => s !== null) ? slots.join("") : ""), [slots]);
  const canSubmit = current.length === length && !submitting;

  const handleDigitClick = (digit: number) => {
    if (disabled[digit]) return;
    // 첫 빈칸 채우기
    const idx = slots.findIndex(s => s === null);
    if (idx === -1) return;
    const next = slots.slice();
    next[idx] = String(digit);
    setSlots(next);

    const dis = disabled.slice();
    dis[digit] = true; // 중복 선택 방지
    setDisabled(dis);
  };

  const handleSlotClick = (i: number) => {
    const v = slots[i];
    if (v === null) return;
    const digit = Number(v);

    const next = slots.slice();
    next[i] = null;
    setSlots(next);

    const dis = disabled.slice();
    dis[digit] = false; // 다시 선택 가능
    setDisabled(dis);
  };

  const handleClear = () => {
    setSlots(Array.from({ length }, () => null));
    setDisabled(Array(10).fill(false));
  };

  const submit = () => {
    if (!canSubmit) return;
    const guess = current;

    // 안전 검증 (중복/길이)
    const err = validateGuess(guess, length);
    if (err) {
      // 토스트 대신 조용히 리턴(요청: 에러 노출 X)
      return;
    }

    setSubmitting(true);
    const res = judgeGuess(guess, secret);
    const line = formatAttemptLine(attemptIndex1, guess, res);
    const win = res.strike === length;
    onClose({ win, guess, result: res, historyLine: line });
  };

  if (!open) return null;

  return (
    <div style={S.backdrop}>
      <div style={S.panel}>
        <div style={S.title}>숫자야구</div>

        {/* 선택 슬롯 */}
        <div style={S.slots}>
          {slots.map((v, i) => (
            <button
              key={i}
              onClick={() => handleSlotClick(i)}
              style={S.slotBtn}
              aria-label={`slot-${i}`}
              title="클릭하면 이 자리 숫자를 지웁니다"
            >
              {v ?? "—"}
            </button>
          ))}
        </div>

        {/* 0~9 숫자 카드 */}
        <div style={S.pad}>
          {Array.from({ length: 10 }, (_, d) => {
            const disabledDigit = disabled[d];
            return (
              <button
                key={d}
                onClick={() => handleDigitClick(d)}
                disabled={disabledDigit}
                style={{
                  ...S.digitBtn,
                  ...(disabledDigit ? S.digitDisabled : null),
                }}
                aria-label={`digit-${d}`}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* 액션 */}
        <div style={S.actions}>
          <button onClick={handleClear} style={S.clearBtn}>전체 지우기</button>
          <button onClick={submit} disabled={!canSubmit} style={S.submitBtn}>
            제출
          </button>
          <button onClick={() => onClose(null)} style={S.cancelBtn}>닫기</button>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999,
  },
  panel: {
    width: 480, maxWidth: "90vw", background: "#151822", color: "#eee",
    borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    display: "grid", gap: 16,
  },
  title: { fontSize: 20, fontWeight: 700, textAlign: "center" },
  slots: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(48px,1fr))", gap: 8 },
  slotBtn: {
    height: 56, borderRadius: 12, background: "#0e1220", border: "1px solid #2a3355",
    color: "#bcd", fontSize: 20, cursor: "pointer",
  },
  pad: {
    display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10,
  },
  digitBtn: {
    height: 56, borderRadius: 12, background: "#1b2237", border: "1px solid #334175",
    color: "#fff", fontSize: 20, cursor: "pointer",
  },
  digitDisabled: {
    opacity: 0.35, cursor: "not-allowed",
  },
  actions: {
    display: "flex", gap: 12, justifyContent: "flex-end",
  },
  clearBtn: {
    padding: "10px 14px", borderRadius: 10, border: "1px solid #3c4b7a",
    background: "transparent", color: "#cfe",
    cursor: "pointer",
  },
  submitBtn: {
    padding: "10px 14px", borderRadius: 10, border: "none",
    background: "#5b8cff", color: "white", cursor: "pointer",
  },
  cancelBtn: {
    padding: "10px 14px", borderRadius: 10, border: "1px solid #3c4b7a",
    background: "transparent", color: "#eee",
    cursor: "pointer",
  },
};
