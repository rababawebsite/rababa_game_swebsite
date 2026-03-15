export default function PrivacyPage() {
  return (
    <div className="stack-lg">
      <section className="panel legal-hero">
        <p className="eyebrow">Legal</p>
        <h1>Privacy Policy</h1>
        <p>
          We only collect the minimum information needed to run our services,
          support players, and improve game quality.
        </p>
      </section>

      <section className="panel legal-grid">
        <article className="card">
          <h3>Data We Use</h3>
          <p>Account identifiers, gameplay telemetry, and support messages.</p>
        </article>
        <article className="card">
          <h3>Why We Use It</h3>
          <p>To operate online features, prevent abuse, and improve balancing.</p>
        </article>
        <article className="card">
          <h3>Your Control</h3>
          <p>You can request export or deletion of eligible account data.</p>
        </article>
      </section>
    </div>
  );
}
