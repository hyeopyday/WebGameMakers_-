import { useState } from "react";
import "./App.css";
import Agency from "./component/Agency";
import MainMenu from "./component/MainMenu/MainMenu";
import { type Mode } from "./type/numberBaseball";

function App() {
  const [difficulty, setDifficulty] = useState<Mode>(1);
  const [gameStarted, setGameStarted] = useState(false);

  const handleStartGame = (mode: Mode) => {
    setDifficulty(mode);
    setGameStarted(true);
  };

  const handleMainMenu = () => {
    setGameStarted(false);
    setDifficulty(1);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      {!gameStarted ? (
        <MainMenu onStartGame={handleStartGame} />
      ) : (
        <Agency difficulty={difficulty} onMainMenu={handleMainMenu} />
      )}
    </div>
  );
}

export default App;