export default function LegacySiteFrame({ page }) {
  return (
    <div className="legacy-frame-wrap">
      <iframe
        title="Rababa Legacy Site"
        className="legacy-frame"
        src={`/site/${page}`}
      />
    </div>
  );
}
