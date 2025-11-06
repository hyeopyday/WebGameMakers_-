import { Link } from "react-router-dom";
import "./App.css";

function AA() {
  return (
    <div id="AA" className="container">
      <div className="buttonWrapper">
        <Link to="/game">
          <button className="button">게임 시작</button>
        </Link>
        <Link to="/original">
          <button className="button">오리지널 버전</button>
        </Link>
      </div>
    </div>
  );
}

// 호버 효과 추가 (JSX에서 인라인으로는 안 되니까 CSS로 분리하고 싶으면 별도 스타일시트로)
export default AA;
