import Map from './Map/Map';
import { useState, useEffect } from "react";
import type { Cell } from "../type/type";
import { MAP_HEIGHT, MAP_WIDTH } from "../type/type";

import { createGrid, carveMazeDFS, addSmallRooms, carveHighways, braidDeadEnds, openWallsForOpenness } from '../utils/gridGenerator';


function Agency() {
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
    return (
        
        <div style={{ display: "flex", justifyContent: "center" }}>
            <Map grid={grid}/>
        </div>
    )
}

export default Agency
