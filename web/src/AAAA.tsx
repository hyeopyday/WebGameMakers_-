import { BrowserRouter, Route, Routes } from "react-router-dom";
import AA from "./AA";
import App from "./App";
import Original from "../src/component/original/Original";

function AAAA() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AA />} />
                <Route path="/game" element={<App />} />
                <Route path="/original" element={<Original />} />
            </Routes>
        </BrowserRouter>
    );
}
export default AAAA;


