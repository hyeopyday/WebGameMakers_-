import Map from "./Map/Map";
import { useState, useEffect } from "react";
import type { Cell } from "../type/type";
import { MAP_HEIGHT, MAP_WIDTH } from "../type/type";

import {
  createGrid,
  carveMazeDFS,
  addSmallRooms,
  carveHighways,
  braidDeadEnds,
  openWallsForOpenness,
} from "../utils/gridGenerator";

interface AgencyProps {
  difficulty: "normal" | "hard" | "hell";
}

function Agency({ difficulty }: AgencyProps) {
  const [grid, setGrid] = useState<Cell[][]>([]);

  useEffect(() => {
    const g = createGrid(MAP_WIDTH, MAP_HEIGHT);
    carveMazeDFS(g, 1, 1);

    // 난이도에 따라 미로 생성 파라미터 조정
    switch (difficulty) {
      case "normal":
        addSmallRooms(g, { count: 3 });
        carveHighways(g, { horiz: 1, vert: 1, thickness: 1 });
        braidDeadEnds(g, 0.28);
        openWallsForOpenness(g, 0.35);
        break;
      case "hard":
        addSmallRooms(g, { count: 2 });
        carveHighways(g, { horiz: 1, vert: 1, thickness: 1 });
        braidDeadEnds(g, 0.15);
        openWallsForOpenness(g, 0.2);
        break;
      case "hell":
        addSmallRooms(g, { count: 1 });
        braidDeadEnds(g, 0.05);
        openWallsForOpenness(g, 0.1);
        break;
    }

    setGrid(g);
  }, [difficulty]);

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <Map grid={grid} />
    </div>
  );
}

export default Agency;