import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <h1>Not found</h1>
      <p className="lede">
        This application exposes exactly seven checks. A check id outside that set returns nothing
        rather than an empty result, so a mistyped link is visible instead of silent.
      </p>
      <Link className="primary" href="/findings">
        View findings
      </Link>
    </>
  );
}
