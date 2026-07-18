import { Route, Routes } from "react-router";
import { Navbar } from "./components/Navbar";
import { LoginPage } from "./pages/LoginPage";
import { SignalPage } from "./pages/SignalPage";
import { SystemPage } from "./pages/SystemPage";
import { WifiPage } from "./pages/WifiPage";

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<SignalPage />} />
          <Route path="/wifi" element={<WifiPage />} />
          <Route path="/system" element={<SystemPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<SignalPage />} />
        </Routes>
      </main>
    </div>
  );
}
