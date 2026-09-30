const motifs: Record<string, { code: string; color: string; tint: string }> = {
  "phuoc-os": { code: "01 / INTERFACE", color: "#b8a7ff", tint: "#292336" },
  "nav-ai": { code: "02 / INFERENCE", color: "#e9a8ba", tint: "#33232c" },
  milo: { code: "03 / MOTION", color: "#e6c494", tint: "#312921" },
  "digit-preprocessing": { code: "01 / VISION", color: "#91c8c8", tint: "#1d3335" },
  "browser-inference": { code: "02 / EDGE", color: "#b7bcff", tint: "#222744" },
  "human-ai-interface": { code: "03 / UX", color: "#e4b6d9", tint: "#32243a" },
};

export function EditorialThumbnail({ id, src }: { id: string; src?: string }) {
  if (src) return <span className="editorial-thumbnail" aria-hidden="true"><img src={src} alt="" loading="lazy" /></span>; // eslint-disable-line @next/next/no-img-element
  const motif = motifs[id] ?? motifs["phuoc-os"];
  return (
    <span className="editorial-thumbnail" aria-hidden="true">
      <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`grid-${id}`} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M16 0H0V16" fill="none" stroke="#fff" strokeOpacity=".055" />
          </pattern>
          <linearGradient id={`fade-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={motif.tint} /><stop offset="1" stopColor="#111217" />
          </linearGradient>
        </defs>
        <rect width="320" height="180" fill={`url(#fade-${id})`} />
        <rect width="320" height="180" fill={`url(#grid-${id})`} />
        <circle cx="260" cy="28" r="65" fill={motif.color} opacity=".1" />
        {id === "phuoc-os" && <g fill="none" stroke={motif.color} strokeWidth="1.2"><rect x="55" y="42" width="210" height="102" rx="3" /><path d="M55 59h210M113 59v85M64 70h38m-38 12h28m-28 12h34M125 75h52v39h-52zm65 0h62v14h-62zm0 22h62v17h-62z" /><circle cx="64" cy="51" r="2" fill={motif.color} /><circle cx="71" cy="51" r="2" fill={motif.color} /></g>}
        {id === "nav-ai" && <g fill="none" stroke={motif.color} strokeLinecap="round"><rect x="101" y="24" width="118" height="132" rx="4" strokeOpacity=".65" /><path d="M124 65c28-27 63-6 22 22 53-14 53 35-17 37" strokeWidth="8" /><path d="M232 59h32m-32 13h21m-21 13h27" strokeOpacity=".5" /></g>}
        {id === "milo" && <g fill={motif.color}><path d="M101 68 93 40l28 16h68l28-16-8 29 13 16-5 47H98l-5-47z" opacity=".8" /><path d="M111 88h23v8h-23zm64 0h23v8h-23zM150 108h13v8h-13z" fill="#18171a" /><path d="M97 137h130v5H97z" opacity=".25" /></g>}
        {id === "digit-preprocessing" && <g fill="none" stroke={motif.color}><rect x="68" y="30" width="84" height="112" /><path d="M80 41h60M80 54h60M80 67h60M80 80h60M80 93h60M80 106h60M80 119h60M92 31v110m12-110v110m12-110v110m12-110v110" opacity=".35" /><path d="M92 74c14-16 47 0 18 17 35-8 28 28-11 27" strokeWidth="6" strokeLinecap="round" /><path d="M160 86h36m-9-9 9 9-9 9" /><rect x="205" y="50" width="62" height="72" /><path d="M215 59h42m-42 9h42m-42 9h42m-42 9h42m-42 9h42m-42 9h42" opacity=".35" /></g>}
        {id === "browser-inference" && <g fill="none" stroke={motif.color}><rect x="114" y="45" width="92" height="90" rx="5" strokeWidth="2" /><rect x="131" y="62" width="58" height="56" rx="3" /><path d="M125 25v20m19-20v20m19-20v20m19-20v20m19-20v20M125 135v20m19-20v20m19-20v20m19-20v20m19-20v20M94 56h20M94 77h20M94 98h20M94 119h20m112-63h20m-20 21h20m-20 21h20m-20 21h20" /><path d="m146 90 13-13 14 13-14 14z" fill={motif.color} fillOpacity=".4" /></g>}
        {id === "human-ai-interface" && <g fill="none" stroke={motif.color}><rect x="62" y="42" width="196" height="98" rx="4" /><path d="M62 59h196M83 83h34m-34 13h61m-61 13h50m54-32h50m-50 13h32m-32 13h38" strokeOpacity=".65" /><circle cx="169" cy="89" r="21" strokeWidth="3" strokeDasharray="100 34" transform="rotate(-90 169 89)" /><path d="m165 89 4 4 8-10" /></g>}
        <text x="17" y="168" fill={motif.color} fontSize="9" fontFamily="monospace" letterSpacing="1.6">{motif.code}</text>
        <text x="289" y="168" fill="#ffffff77" fontSize="9" fontFamily="monospace">↗</text>
      </svg>
    </span>
  );
}
