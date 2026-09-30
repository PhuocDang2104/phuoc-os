import type { GalleryItem } from "@/lib/gallery";

// Server and browser Math implementations can differ in the last decimal place.
// Stable SVG attributes keep the auto-open gallery's initial HTML hydratable.
const stable = (value: number) => Number(value.toFixed(3));

export function GalleryArt({ art }: { art: GalleryItem["art"] }) {
  return (
    <svg viewBox="0 0 300 152" aria-hidden="true" className={`gallery-art art-${art}`}>
      {art === "digit" && (
        <>
          <rect width="300" height="152" fill="#d7d4cc" />
          {Array.from({ length: 15 }, (_, i) => (
            <path key={i} d={`M${i * 22} 0v152 M0 ${i * 22}h300`} stroke="#292b3010" />
          ))}
          <text x="21" y="25" fontSize="8" fill="#5f5b65" fontFamily="monospace">
            NAV.AI / 001
          </text>
          <path
            d="M140 36C190 12 210 53 172 76C221 66 202 123 149 119"
            fill="none"
            stroke="#44404a"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path d="M240 45h25m-7-6 7 6-7 6" fill="none" stroke="#756781" />
          <text x="20" y="131" fontSize="8" fill="#5f5b65" fontFamily="monospace">
            DRAW → RECOGNIZE → EXPLORE
          </text>
        </>
      )}
      {art === "field" && (
        <>
          <rect width="300" height="152" fill="#171a1a" />
          {Array.from({ length: 630 }, (_, i) => {
            const x = i % 45,
              y = Math.floor(i / 45);
            return (
              <circle
                key={i}
                cx={x * 7}
                cy={stable(32 + y * 7 + Math.sin(x / 6 + y / 8) * 26)}
                r=".9"
                fill="#c4c8b3"
                opacity={stable(0.3 + y / 22)}
              />
            );
          })}
          <text x="16" y="20" fontSize="7" fill="#a9b3a4" fontFamily="monospace">
            f(x, y) / CONTINUOUS FIELD
          </text>
        </>
      )}
      {art === "chip" && (
        <>
          <rect width="300" height="152" fill="#292b30" />
          {Array.from({ length: 7 }, (_, i) => (
            <path
              key={i}
              d={`M${105 + i * 15} 40V${12 + (i % 2) * 12} M${105 + i * 15} 112v${12 + (i % 2) * 12} M100 ${45 + i * 10}H${35 + (i % 2) * 20} M200 ${45 + i * 10}h${40 + (i % 2) * 20}`}
              stroke="#84839d"
              strokeWidth="1"
              opacity=".6"
            />
          ))}
          <rect x="100" y="34" width="100" height="84" rx="3" fill="#1a1c20" stroke="#9994ac" />
          <rect x="108" y="42" width="84" height="68" rx="1" fill="#34333d" stroke="#636070" />
          <text
            x="150"
            y="77"
            textAnchor="middle"
            fontSize="15"
            fill="#ded9e8"
            fontFamily="monospace"
          >
            EDGE
          </text>
          <text
            x="150"
            y="93"
            textAnchor="middle"
            fontSize="7"
            fill="#a29aa9"
            fontFamily="monospace"
          >
            MODELS → MACHINES
          </text>
        </>
      )}
      {art === "vision" && (
        <>
          <rect width="300" height="152" fill="#d0d5cd" />
          <path d="M40 117 99 43l29 36 53-63 80 111Z" fill="#969f94" />
          <path d="m42 119 60-55 48 44 34-59 69 80Z" fill="#657363" />
          <path d="M0 131 97 106l78 30 125-28v44H0Z" fill="#abb6a7" />
          <path
            d="M68 28h46v71H68z M161 12h55v88h-55z"
            fill="none"
            stroke="#3a5243"
            strokeDasharray="3 2"
          />
          <path d="M8 8h18M8 8v18M292 144h-18m18 0v-18" stroke="#35483a" />
          <text x="16" y="142" fontSize="7" fill="#314338" fontFamily="monospace">
            COMPUTER VISION / RESEARCH AREA
          </text>
        </>
      )}
      {art === "notes" && (
        <>
          <rect width="300" height="152" fill="#bdb2a7" />
          <g transform="translate(63 -9) rotate(7 85 85)">
            <rect width="175" height="189" fill="#f0e9dc" />
            <text x="16" y="37" fontSize="8" fill="#746858" fontFamily="monospace">
              ENGINEERING NOTES
            </text>
            <text x="16" y="64" fontSize="22" fill="#36332f" fontFamily="Georgia,serif">
              What if?
            </text>
            {[84, 94, 104, 114, 138, 148].map((y, i) => (
              <path
                key={y}
                d={`M16 ${y}h${i % 3 === 0 ? 92 : 139}`}
                stroke="#9d9586"
                strokeWidth="1"
              />
            ))}
            <circle cx="132" cy="62" r="16" fill="none" stroke="#777161" strokeDasharray="3 2" />
          </g>
        </>
      )}
      {art === "core" && (
        <>
          <rect width="300" height="152" fill="#15121c" />
          {Array.from({ length: 370 }, (_, i) => {
            const y = 1 - (2 * i) / 369,
              r = Math.sqrt(1 - y * y),
              t = i * 2.39996;
            return (
              <circle
                key={i}
                cx={stable(150 + Math.cos(t) * r * 64)}
                cy={stable(76 + y * 64)}
                r={stable(0.6 + (Math.sin(t) + 1) * 0.45)}
                fill="#b6a0d9"
                opacity={stable(0.2 + (Math.sin(t) + 1) * 0.35)}
              />
            );
          })}
          <text x="15" y="22" fontSize="7" fill="#9080a3" fontFamily="monospace">
            LATENT SPACE / EXPLORE
          </text>
        </>
      )}
      {art === "workspace" && (
        <>
          <rect width="300" height="152" fill="#abb1ba" />
          <rect x="26" y="20" width="248" height="143" rx="5" fill="#141418" stroke="#52505e" />
          <path d="M27 38h246" stroke="#514a61" />
          <circle cx="37" cy="29" r="2" fill="#b8a7ff" />
          <text x="47" y="32" fontSize="6" fill="#aaa1b9" fontFamily="monospace">
            PHUOC.OS
          </text>
          <rect x="48" y="61" width="125" height="71" rx="2" fill="#24232a" stroke="#686070" />
          <path d="M48 74h125M59 92h76M59 101h98M59 110h54" stroke="#a398b1" strokeWidth="1" />
          <rect x="183" y="48" width="70" height="68" rx="2" fill="#25222d" stroke="#71697f" />
          <path d="M192 65h42m-42 11h30m-30 11h50m-50 11h24" stroke="#90849e" />
        </>
      )}
    </svg>
  );
}
