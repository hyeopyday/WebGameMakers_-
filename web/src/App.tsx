import { useState } from "react";
import "./App.css";
import Agency from "./component/Agency";
import MainMenu from "./component/MainMenu/MainMenu";

type Difficulty = "normal" | "hard" | "hell" | null;

function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const handleStartGame = (selectedDifficulty: "normal" | "hard" | "hell") => {
    setDifficulty(selectedDifficulty);
    setGameStarted(true);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      {!gameStarted ? (
        <MainMenu onStartGame={handleStartGame} />
      ) : (
        <Agency difficulty={difficulty!} />
      )}
    </div>
  );
}

export default App;