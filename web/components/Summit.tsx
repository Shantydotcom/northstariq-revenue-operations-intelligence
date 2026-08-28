/**
 * The Northstar summit — original artwork, drawn as inline SVG.
 *
 * Nothing here is extracted from the design reference. It is four receding
 * ridge paths in cooling blues, a pale sky wash, a few contour strokes on the
 * near face and the star above the peak: the reference's visual character,
 * built from scratch so the repository owns it.
 *
 * An earlier attempt did this with CSS `clip-path` and background sizing. It
 * produced angular fragments rather than ridges, because a single clipped box
 * cannot express layered depth. Paths can, so paths it is.
 *
 * Purely decorative. `aria-hidden` and no title: the hero already says what
 * the page is, and a screen reader gains nothing from a described mountain.
 * It also fades out on the left so it never sits behind the text.
 */
export default function Summit({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 620 340"
      preserveAspectRatio="xMaxYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="niq-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dfeafb" />
          <stop offset="100%" stopColor="#eef4fd" />
        </linearGradient>
        <linearGradient id="niq-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b9cfe9" />
          <stop offset="100%" stopColor="#cddef1" />
        </linearGradient>
        <linearGradient id="niq-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fb0d8" />
          <stop offset="100%" stopColor="#aac4e2" />
        </linearGradient>
        <linearGradient id="niq-peak" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#f2f7fe" />
          <stop offset="34%" stopColor="#9fc0e6" />
          <stop offset="100%" stopColor="#4a72ad" />
        </linearGradient>
        <linearGradient id="niq-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5c81b6" />
          <stop offset="100%" stopColor="#3d5f92" />
        </linearGradient>

        {/*
         * Fades the whole scene out toward the text.
         *
         * WHITE stops, not black. An SVG <mask> resolves by LUMINANCE by
         * default, so a black gradient - whatever its alpha - masks everything
         * away. This cost one silent, entirely invisible render to find.
         */}
        <linearGradient id="niq-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="38%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="72%" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="niq-mask">
          <rect width="620" height="340" fill="url(#niq-fade)" />
        </mask>
      </defs>

      <g mask="url(#niq-mask)">
        <rect width="620" height="340" fill="url(#niq-sky)" />

        {/* Contour sweep — the topographic character, kept very faint. */}
        <g stroke="#5b7fae" strokeOpacity="0.16" fill="none" strokeWidth="1">
          <path d="M-40 96C90 60 214 78 330 40S560 6 664 44" />
          <path d="M-40 128C86 92 214 112 330 74S560 40 664 78" />
          <path d="M-40 160C82 124 214 146 330 108S560 74 664 112" />
        </g>

        {/* Far range */}
        <path
          d="M-20 232 92 150l58 44 74-62 66 58 56-40 92 76 106-58 88 66v104H-20Z"
          fill="url(#niq-far)"
        />
        {/* Middle range */}
        <path
          d="M-20 268 76 196l64 46 72-56 78 64 70-40 96 70 92-48 92 62v98H-20Z"
          fill="url(#niq-mid)"
        />

        {/* The peak, with its snow face and a shadowed flank. */}
        <path d="M236 336 386 162l150 174H236Z" fill="url(#niq-peak)" />
        <path d="M386 162l150 174H418L386 162Z" fill="#3f66a0" fillOpacity="0.42" />
        {/* Snow cap — a filled facet with an uneven lower edge. */}
        <path
          d="M386 162l40 52-14 6-12-10-14 12-16-8-14 10-12-8-10 6L386 96Z"
          fill="#ffffff"
          fillOpacity="0.9"
        />

        {/* Near ridge, closing the base */}
        <path
          d="M-20 320 84 262l70 34 66-24 84 44 74-30 92 46 90-34 100 44v40H-20Z"
          fill="url(#niq-near)"
          fillOpacity="0.85"
        />
      </g>

      {/*
       * The Northstar, just clear of the apex.
       *
       * Kept well inside the viewBox: `preserveAspectRatio="slice"` crops the
       * top when the box is wider than it is tall, and at y=44 the star was
       * cropped away entirely.
       */}
      <g transform="translate(386 128)">
        <circle r="22" fill="#3d8bff" fillOpacity="0.18" />
        <path
          d="M0-30c.5 12.2 1.9 19.3 4.2 22.6C5.9-5 9.1-3.4 14.3-2 9.1-.6 5.9 1 4.2 3.4 1.9 6.7.5 13.8 0 26c-.5-12.2-1.9-19.3-4.2-22.6C-5.9 1-9.1-.6-14.3-2c5.2-1.4 8.4-3 10.1-5.4C-1.9-10.7-.5-17.8 0-30Z"
          fill="#2f80f5"
          transform="scale(0.72)"
        />
      </g>
    </svg>
  );
}
