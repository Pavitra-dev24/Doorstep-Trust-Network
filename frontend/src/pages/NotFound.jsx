import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="section container-narrow">
      <div className="section-head">
        <h2>Page not found</h2>
        <p>That page doesn't exist.</p>
      </div>
      <Link className="btn btn-primary" to="/">Back to lookup</Link>
    </section>
  );
}
