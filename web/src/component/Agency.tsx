// Agency.tsx (또는 MainMenu 등 모달을 띄우는 곳)
import { useEffect, useState } from "react";
import NumberBaseball from "./NumberBaseball/NumberBaseball";            // 너 파일명
import { MODE_LENGTH, generateSecret } from "../type/numberBaseball";
import { createGrid, carveMazeDFS, addSmallRooms, carveHighways, braidDeadEnds, openWallsForOpenness } from '../utils/gridGenerator';
import { type Cell, MAP_WIDTH, MAP_HEIGHT } from "../type/type";
import Map from "./Map/Map";
import { type Mode } from "../type/numberBaseball";
// ... Map import 등
interface AgencyProps {
    difficulty : Mode
}

function Agency({ difficulty }: AgencyProps) {
    const [mode, setMode] = useState<1 | 2 | 3>(1);
    const length = MODE_LENGTH[mode];
    const [secret, setSecret] = useState(() => generateSecret(length));

    const [isPaused, setPaused] = useState(false);
    const [nbOpen, setNbOpen] = useState(false);

    const [attemptCount, setAttemptCount] = useState(0);
    const [history, setHistory] = useState<string[]>([]);

    // 🔸 충돌 이벤트 수신 → 모달 오픈 + 일시정지
    useEffect(() => {
        const onCollide = () => {
            setPaused(true);
            setNbOpen(true);
        };
        window.addEventListener("enemyA-collide", onCollide as EventListener);
        return () => window.removeEventListener("enemyA-collide", onCollide as EventListener);
    }, []);

    const handleClose = (res: {
        guess: string;
        result: { strike: number; ball: number; out: number };
        historyLine: string;
        win: boolean;
    } | null) => {
        setNbOpen(false);
        setPaused(false);
        if (!res) return;
        const idx = attemptCount + 1;
        setAttemptCount(idx);
        setHistory((prev) => [...prev, res.historyLine]);
        if (res.win) {
            // TODO: 전체 게임 승리 처리
        }
    };

    const [grid, setGrid] = useState<Cell[][]>([]);

    useEffect(() => {
        const g = createGrid(MAP_WIDTH, MAP_HEIGHT);
        carveMazeDFS(g, 1, 1);
        addSmallRooms(g, { count: 3 });
        carveHighways(g, { horiz: 1, vert: 1, thickness: 1 });
        braidDeadEnds(g, 0.28);
        openWallsForOpenness(g, 0.35);
        setGrid(g);
    }, []);
    // TODO: isPaused를 Character/입력 루프에 전달하고 싶으면 <Character paused={isPaused} /> 식으로 내려주면 됨.

    useEffect(() => {
        const g = createGrid(MAP_WIDTH, MAP_HEIGHT);
        carveMazeDFS(g, 1, 1);

        // 난이도에 따라 미로 생성 파라미터 조정
        switch (difficulty) {
            case 1:
                addSmallRooms(g, { count: 3 });
                carveHighways(g, { horiz: 1, vert: 1, thickness: 1 });
                braidDeadEnds(g, 0.28);
                openWallsForOpenness(g, 0.35);
                break;
            case 2:
                addSmallRooms(g, { count: 2 });
                carveHighways(g, { horiz: 1, vert: 1, thickness: 1 });
                braidDeadEnds(g, 0.15);
                openWallsForOpenness(g, 0.2);
                break;
            case 3:
                addSmallRooms(g, { count: 1 });
                braidDeadEnds(g, 0.05);
                openWallsForOpenness(g, 0.1);
                break;
        }

        setGrid(g);
    }, [difficulty]);

    return (
        <>
            {/* 네 UI … */}
            <Map grid={grid} paused={isPaused} />
            {/* 모달 */}
            <NumberBaseball
                open={nbOpen}
                length={length}
                secret={secret}
                attemptIndex1={attemptCount + 1}
                onClose={handleClose}
                history={history}
            />
            <div
                id="nb-history"
                style={{
                    position: "absolute",
                    top: "20px",
                    left: "20px",
                    background: "rgba(0, 0, 0, 0.6)",
                    color: "white",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    fontFamily: "monospace",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    maxHeight: "200px",
                    width: "240px",
                    overflowY: "auto",
                    boxShadow: "0 0 6px rgba(0,0,0,0.5)",
                    zIndex: 1000,
                }}
            >
                <h3 style={{ marginTop: 0, fontSize: "16px", borderBottom: "1px solid #888" }}>
                    ⚾ Number Baseball
                </h3>
                {/* 여기에 시도 기록들 출력 */}
                {history.length === 0 ? (
                    <div style={{ opacity: 0.6 }}>No attempts yet.</div>
                ) : (
                    history.map((line, i) => <div key={i}>{line}</div>)
                )}
            </div>

        </>
    );
}



export default Agency;
