import { Navigate, Route, Routes } from "react-router-dom";
import LegacySiteFrame from "./components/LegacySiteFrame";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LegacySiteFrame page="index.html" />} />
      <Route path="/careers" element={<LegacySiteFrame page="careers.html" />} />
      <Route path="/privacy" element={<LegacySiteFrame page="privacy_policy.html" />} />
      <Route path="/terms" element={<LegacySiteFrame page="terms_and_conditions.html" />} />
      <Route path="/dashboard" element={<Navigate to="http://localhost:5174" replace />} />
      <Route path="*" element={<LegacySiteFrame page="404.html" />} />
    </Routes>
  );
}
