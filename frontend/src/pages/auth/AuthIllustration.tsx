/**
 * Isometric learning illustration for the authentication pages.
 *
 * Inline SVG rather than an image file: it stays crisp at any size, weighs
 * nothing next to a PNG, inherits the palette, and adds no network request on
 * the one screen a student sees before anything is cached. `aria-hidden`
 * because it is decoration — the heading already says what the page is.
 */
export default function AuthIllustration() {
  return (
    <svg
      className="authart__svg"
      viewBox="0 0 420 380"
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="globeG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5eb8f5" />
          <stop offset="1" stopColor="#1c6fd0" />
        </linearGradient>
        <linearGradient id="capG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b4fc4" />
          <stop offset="1" stopColor="#23307e" />
        </linearGradient>
        <linearGradient id="panelG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eaf1fb" />
        </linearGradient>
      </defs>

      {/* floating data panels, back layer */}
      <g className="art-float art-float--slow">
        <rect x="248" y="34" width="128" height="86" rx="8" fill="url(#panelG)" stroke="#c9d8ef" />
        <rect x="260" y="48" width="60" height="7" rx="3.5" fill="#c2d3ea" />
        <rect x="260" y="66" width="104" height="5" rx="2.5" fill="#e0e8f5" />
        <rect x="260" y="78" width="86" height="5" rx="2.5" fill="#e0e8f5" />
        <rect x="260" y="90" width="96" height="5" rx="2.5" fill="#e0e8f5" />
        <rect x="260" y="102" width="52" height="5" rx="2.5" fill="#e0e8f5" />
      </g>

      <g className="art-float">
        <rect x="272" y="140" width="118" height="92" rx="8" fill="url(#panelG)" stroke="#c9d8ef" />
        {/* bar chart */}
        <rect x="288" y="196" width="14" height="22" rx="3" fill="#7fb6f0" />
        <rect x="310" y="180" width="14" height="38" rx="3" fill="#4a93e8" />
        <rect x="332" y="166" width="14" height="52" rx="3" fill="#2f6fd0" />
        <rect x="354" y="188" width="14" height="30" rx="3" fill="#a9cdf5" />
        <rect x="288" y="154" width="46" height="6" rx="3" fill="#c2d3ea" />
      </g>

      {/* pie panel */}
      <g className="art-float art-float--fast">
        <rect x="250" y="248" width="96" height="88" rx="8" fill="url(#panelG)" stroke="#c9d8ef" />
        <circle cx="298" cy="292" r="26" fill="#e3edfa" />
        <path d="M298 292 L298 266 A26 26 0 0 1 320 305 Z" fill="#2f6fd0" />
        <path d="M298 292 L320 305 A26 26 0 0 1 276 306 Z" fill="#63a8ef" />
      </g>

      {/* globe on a stand */}
      <g className="art-float art-float--slow">
        <circle cx="96" cy="86" r="46" fill="url(#globeG)" />
        <ellipse cx="96" cy="86" rx="46" ry="18" fill="none" stroke="#bfe0ff" strokeOpacity="0.75" />
        <ellipse cx="96" cy="86" rx="18" ry="46" fill="none" stroke="#bfe0ff" strokeOpacity="0.75" />
        <path d="M62 62 Q96 78 130 62" fill="none" stroke="#bfe0ff" strokeOpacity="0.6" />
        <path d="M62 110 Q96 94 130 110" fill="none" stroke="#bfe0ff" strokeOpacity="0.6" />
        {/* landmass suggestions */}
        <path d="M74 70 q12 -8 22 2 t18 -2 l-6 14 q-16 6 -26 -2 z" fill="#2a63b8" opacity="0.45" />
        <path d="M84 104 q14 6 26 -2 l-4 12 q-14 4 -22 -2 z" fill="#2a63b8" opacity="0.45" />
        <rect x="92" y="132" width="8" height="20" rx="3" fill="#3b4fc4" />
        <path d="M74 158 q22 -12 44 0 z" fill="#23307e" />
      </g>

      {/* book stack */}
      <g>
        <g className="art-book">
          <rect x="52" y="292" width="150" height="20" rx="4" fill="#7b8ff0" />
          <rect x="52" y="292" width="150" height="6" rx="3" fill="#a3b2f7" />
        </g>
        <g className="art-book">
          <rect x="62" y="270" width="150" height="20" rx="4" fill="#3b4fc4" />
          <rect x="62" y="270" width="150" height="6" rx="3" fill="#6376dd" />
        </g>
        <g className="art-book">
          <rect x="48" y="248" width="150" height="20" rx="4" fill="#9aa8f5" />
          <rect x="48" y="248" width="150" height="6" rx="3" fill="#c2cbfb" />
        </g>
        <g className="art-book">
          <rect x="66" y="226" width="132" height="20" rx="4" fill="#2c3a9e" />
          <rect x="66" y="226" width="132" height="6" rx="3" fill="#4a58bd" />
        </g>
      </g>

      {/* graduation cap on the stack */}
      <g className="art-float">
        <path d="M132 186 L196 208 L132 230 L68 208 Z" fill="url(#capG)" />
        <path d="M132 200 L172 214 L132 228 L92 214 Z" fill="#1b2570" opacity="0.55" />
        <path d="M180 213 v22 a4 4 0 0 0 8 0 v-25" fill="none" stroke="#f2b23c" strokeWidth="4" strokeLinecap="round" />
        <circle cx="184" cy="240" r="5" fill="#f2b23c" />
      </g>

      {/* phone */}
      <g className="art-float art-float--fast">
        <rect x="8" y="196" width="46" height="76" rx="9" fill="#ffffff" stroke="#c9d8ef" />
        <rect x="15" y="206" width="32" height="50" rx="4" fill="#e3edfa" />
        <rect x="21" y="264" width="20" height="4" rx="2" fill="#d4e1f2" />
      </g>

      {/* pencil */}
      <g className="art-float art-float--slow">
        <g transform="rotate(38 60 330)">
          <rect x="28" y="322" width="76" height="12" rx="3" fill="#f2b23c" />
          <rect x="28" y="322" width="14" height="12" rx="3" fill="#e0e6ef" />
          <path d="M104 322 l16 6 l-16 6 z" fill="#3b2f1e" />
        </g>
      </g>

      {/* small ladder, echoing the reference */}
      <g stroke="#3b4fc4" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.9">
        <path d="M214 250 L232 196" />
        <path d="M228 254 L246 200" />
        <path d="M220 240 L235 244" />
        <path d="M225 226 L240 230" />
        <path d="M230 212 L245 216" />
      </g>
    </svg>
  )
}
