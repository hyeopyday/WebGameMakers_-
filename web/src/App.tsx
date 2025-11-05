import { useState } from "react";
import "./App.css";
import Agency from "./component/Agency";
import MainMenu from "./component/MainMenu/MainMenu";
import { type Mode } from "./type/numberBaseball";

function App() {
  const [difficulty, setDifficulty] = useState<Mode>(3);
  const [gameStarted, setGameStarted] = useState(false);

  const handleStartGame = (mode : Mode) => {
    setDifficulty(mode);
    setGameStarted(true);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center"}}>
      {!gameStarted ? (
        <MainMenu onStartGame={handleStartGame} />
      ) : (
        <Agency difficulty={difficulty!} />
      )}
    </div>
  );
}

export default App;