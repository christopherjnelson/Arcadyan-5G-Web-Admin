import { Route, Routes } from "react-router-dom";
import Signal from "./signal";
import NavContainer from "./nav";
import System from "./system";

function App() {
  return (
    <div>
      <NavContainer />
      <Routes>
        <Route path="/" element={<Signal />} />
        <Route path="/system" element={<System />} />
      </Routes>
    </div>
  );
}

export default App;
