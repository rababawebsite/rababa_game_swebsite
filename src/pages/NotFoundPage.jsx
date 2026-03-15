import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="panel page-hero stack">
      <p className="eyebrow">Error 404</p>
      <h1>Page Not Found</h1>
      <p>The page you requested does not exist or has been moved.</p>
      <Link className="button-link" to="/">Go back home</Link>
    </section>
  );
}
