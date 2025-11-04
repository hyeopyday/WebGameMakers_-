// src/components/Agency.tsx (경로는 네 프로젝트 구조에 맞춰)
import React, { useState, useCallback } from "react";
import NumberBaseballModal, { type NBResult } from "./NumberBaseball/NumberBaseball";
import { MODE_LENGTH, type Mode, generateSecret } from "../type/numberBaseball";

export default function Agency() {
  const [mode, setMode] = useState<Mode>(1);
  const length = MODE_LENGTH[mode];
  const [secret, setSecret] = useState<string>(() => generateSecret(length));
  const [nbOpen, setNbOpen] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  const changeMode = (m: Mode) => {
    setMode(m);
    const L = MODE_LENGTH[m];
    setSecret(generateSecret(L));
    setHistory([]);
    setAttemptCount(0);
  };

  const onCollideEnemyA = useCallback(() => {
    setNbOpen(true);
  }, []);

  const handleClose = (res: NBResult | null) => {
    setNbOpen(false);
    if (!res) return;

    const idx = attemptCount + 1;
    setAttemptCount(idx);
    setHistory((prev) => [...prev, res.historyLine]);

    if (res.win) {
      // 전부 Strike → 전체 게임 승리 처리(임시)
      alert("Victory! 전체 게임 클리어(임시)");
    } else {
      // 부분 일치/실패 → 아이템 지급 등의 로직 가능
      // res.result.strike / ball / out 참조
    }
  };

  return (
    <div style={{ color: "#fff" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => changeMode(1)}>모드1(4자리)</button>
        <button onClick={() => changeMode(2)}>모드2(5자리)</button>
        <button onClick={() => changeMode(3)}>모드3(6자리)</button>
        <button onClick={() => setSecret(generateSecret(length))}>비밀값 재생성</button>
        <span>현재 모드: {mode} / 길이: {length} / 비밀값: <code>{secret}</code></span>
      </div>

      <div style={{ marginBottom: 8 }}>총 시도: {attemptCount}</div>
      <pre style={{ background: "#111", padding: 12, borderRadius: 8, minHeight: 80 }}>
        {history.length ? history.join("\n") : "기록 없음"}
      </pre>

      <button onClick={onCollideEnemyA} disabled={nbOpen} style={{ marginTop: 12 }}>
        (테스트) 적A와 충돌하기
      </button>

      <NumberBaseballModal
        open={nbOpen}
        length={length}
        secret={secret}
        attemptIndex1={attemptCount + 1}
        onClose={handleClose}
      />
    </div>
  );
}
