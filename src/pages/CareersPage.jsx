export default function CareersPage() {
  return (
    <div className="stack-lg">
      <section className="panel panel-hero page-hero">
        <div className="hero-copy">
          <p className="eyebrow">Careers</p>
          <h1>Create Games That Last</h1>
          <p>
            We hire builders who care about craft, player experience, and collaboration.
            Join a team where design, art, and engineering move together.
          </p>
        </div>
        <img src="/assets/images/careers-bg.webp" alt="Careers background" className="hero-image" />
      </section>

      <section className="panel">
        <h2>Open Roles</h2>
        <div className="grid">
          <article className="card">
            <p className="tag">Engineering</p>
            <h3>Gameplay Programmer</h3>
            <p>Own core mechanics, input systems, and feel-focused iteration loops.</p>
          </article>
          <article className="card">
            <p className="tag">Art</p>
            <h3>Technical Artist</h3>
            <p>Bridge visual direction and runtime performance across platforms.</p>
          </article>
          <article className="card">
            <p className="tag">Design</p>
            <h3>Level Designer</h3>
            <p>Craft missions and spaces that support narrative and replayability.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
