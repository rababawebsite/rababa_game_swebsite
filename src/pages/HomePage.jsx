const cards = [
  { title: "Takatoro City", desc: "A dark futuristic action world.", tag: "Featured", image: "/assets/images/hero.webp" },
  { title: "Ghost Modem", desc: "Cyber-thriller survival gameplay.", tag: "Best Seller", image: "/assets/images/game-img.webp" },
  { title: "Realm Wars", desc: "Tactical online battles.", tag: "Multiplayer", image: "/assets/images/dlc.webp" },
  { title: "Zen Quest", desc: "Stylized action with meditative pacing.", tag: "New", image: "/assets/images/game-img.webp" }
];

export default function HomePage() {
  return (
    <div className="site-home stack-lg">
      <section className="hero panel panel-hero">
        <div className="hero-copy">
          <p className="eyebrow">Rababa Games Studio</p>
          <h1>Build Worlds Players Remember</h1>
          <p>
            We craft cinematic action games with handcrafted systems, strong worldbuilding,
            and long-term community support.
          </p>
          <div className="hero-actions">
            <a className="button-link" href="#games">Explore Games</a>
            <a className="button-link button-link-muted" href="/careers">Join The Team</a>
          </div>
        </div>
        <img src="/assets/images/hero-collage.webp" alt="Rababa game collage" className="hero-image" />
      </section>

      <section className="panel panel-featured">
        <div>
          <p className="eyebrow">Latest Release</p>
          <h2>Takatoro City</h2>
          <p>
            A neon-drenched city where loyalty is expensive, power is temporary,
            and every mission rewrites your fate.
          </p>
        </div>
        <img src="/assets/images/featured-game-img.webp" alt="Featured game character" className="featured-art" />
      </section>

      <section id="games" className="panel">
        <h2>Game Lineup</h2>
        <div className="grid game-grid">
          {cards.map((card) => (
            <article key={card.title} className="card game-card">
              <img src={card.image} alt={card.title} className="game-thumb" />
              <div>
                <p className="tag">{card.tag}</p>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-team">
        <div>
          <p className="eyebrow">The Team</p>
          <h2>Design, Engineering, and Art In One Pipeline</h2>
          <p>
            Our team combines technical depth with visual direction to ship polished experiences.
            We move fast, test constantly, and iterate with players.
          </p>
        </div>
        <img src="/assets/images/team.webp" alt="Rababa team" className="team-image" />
      </section>
    </div>
  );
}
