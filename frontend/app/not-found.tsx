import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="not-found">
      <span className="eyebrow">404 / PATH NOT FOUND</span>
      <h1>A little off the map.</h1>
      <p>There’s plenty to explore back at the workspace.</p>
      <Link href="/" className="button button-light">
        Return home →
      </Link>
    </main>
  );
}
