import { useLocation } from "react-router-dom";

export default function LegacySiteFrame({ page }) {
  const location = useLocation();
  const src = `/site/${page}${location.search || ""}${location.hash || ""}`;

  return (
    <div className="legacy-frame-wrap">
      <iframe
        title="Rababa Legacy Site"
        className="legacy-frame"
        src={src}
      />
    </div>
  );
}
