export type Mode = 1 | 2 | 3;

export const MODE_LENGTH: Record<Mode, number> = {
  1: 4,
  2: 5,
  3: 6,
};

// 부모가 비밀 숫자를 만들 때 참고용(중복 금지, 선행 0 허용)
export function generateSecret(length: number): string {
  const digits = Array.from({ length: 10 }, (_, i) => String(i));
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, length).join("");
}

/** guess/secret 모두 length 자리 문자열, 각 자리는 0~9, 중복 없다고 가정 */
export function judgeGuess(guess: string, secret: string): {
  strike: number; ball: number; out: number;
} {
  let strike = 0;
  let ball = 0;
  const L = secret.length;
  for (let i = 0; i < L; i++) {
    if (guess[i] === secret[i]) strike++;
    else if (secret.includes(guess[i])) ball++;
  }
  const out = L - strike - ball;
  return { strike, ball, out };
}

/** 히스토리 한 줄 포맷: "n. 2310 1S 2B 1O" */
export function formatAttemptLine(
  index1: number,
  guess: string,
  res: { strike: number; ball: number; out: number }
): string {
  const s = res.strike ? `${res.strike}S` : "";
  const b = res.ball ? `${res.ball}B` : "";
  const o = res.out ? `${res.out}O` : "";
  const tail = [s, b, o].filter(Boolean).join(" ") || "0S 0B 0O";
  return `${index1}. ${guess} ${tail}`.trim();
}

/** 입력 검증: 길이, 중복금지, 숫자만 */
export function validateGuess(guess: string, length: number): string | null {
  if (guess.length !== length) return `길이가 ${length}자리가 아닙니다.`;
  const set = new Set(guess.split(""));
  if (set.size !== length) return "중복 없는 숫자만 허용됩니다.";
  if (!/^\d+$/.test(guess)) return "숫자만 입력하세요.";
  return null;
}
