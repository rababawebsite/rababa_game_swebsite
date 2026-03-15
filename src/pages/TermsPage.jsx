export default function TermsPage() {
  return (
    <div className="stack-lg">
      <section className="panel legal-hero">
        <p className="eyebrow">Legal</p>
        <h1>Terms and Conditions</h1>
        <p>
          By using our games and services, you agree to fair play, respectful conduct,
          and compliance with platform and regional rules.
        </p>
      </section>

      <section className="panel legal-grid">
        <article className="card">
          <h3>Fair Use</h3>
          <p>No cheating, exploitation, or reverse engineering of protected systems.</p>
        </article>
        <article className="card">
          <h3>Community Rules</h3>
          <p>Harassment, hate speech, and abusive behavior may lead to suspension.</p>
        </article>
        <article className="card">
          <h3>Service Changes</h3>
          <p>Features and content can evolve as we patch, rebalance, and expand games.</p>
        </article>
      </section>
    </div>
  );
}
