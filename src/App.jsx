import { Navigate, Route, Routes } from "react-router-dom";
import LegacySiteFrame from "./components/LegacySiteFrame";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LegacySiteFrame page="index.html" />} />
      <Route path="/careers" element={<LegacySiteFrame page="careers.html" />} />
      <Route path="/privacy" element={<LegacySiteFrame page="privacy_policy.html" />} />
      <Route path="/terms" element={<LegacySiteFrame page="terms_and_conditions.html" />} />
      <Route path="/games/game1/index.html" element={<LegacySiteFrame page="games/game1/index.html" />} />
      <Route path="/games/game1/privacy_policy.html" element={<LegacySiteFrame page="games/game1/privacy_policy.html" />} />
      <Route path="/games/game1/terms_and_conditions.html" element={<LegacySiteFrame page="games/game1/terms_and_conditions.html" />} />
      <Route path="/dashboard" element={<Navigate to="https://rababa-game-swebsite-4nn9.vercel.app/" replace />} />
      <Route path="*" element={<LegacySiteFrame page="404.html" />} />
    </Routes>
  );
}
