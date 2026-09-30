"use client";

export type CatAction =
  "idle" | "walk" | "run" | "hop" | "jump" | "climb" | "sit" | "stretch" | "lie" | "sleep";

// Original layered pixel illustration. Each limb can animate independently;
// lying/sitting have their own silhouettes instead of scaling the standing sprite.
export function CatArt({ action }: { action: CatAction }) {
  const resting = action === "lie" || action === "sleep";
  const sitting = action === "sit" || action === "idle";
  return (
    <svg viewBox="0 0 90 64" className="milo-art" shapeRendering="crispEdges" aria-hidden="true">
      <g className="milo-standing" style={{ opacity: resting ? 0 : 1 }}>
        <g className="milo-tail" style={{ transformOrigin: "27px 38px" }}>
          <path d="M29 36H20V32H15V20H12V10H6V12H4V22H7V32H11V39H18V43H30Z" fill="#64596f" />
          <path d="M27 38H19V34H14V22H11V13H7V21H10V31H14V37H21V41H28Z" fill="#aea3ba" />
          <path d="M7 13H11V20H7Z" fill="#e3dce9" />
          <path d="M11 28H15V32H11ZM16 35H20V39H16Z" fill="#897b99" />
        </g>
        <g className="milo-back-leg">
          <path d="M31 38H39V53H42V58H30V54H28V44Z" fill="#8f839f" />
          <path d="M30 54H40V58H30Z" fill="#c6bccf" />
        </g>
        <g className="milo-back-leg second">
          <path d="M53 38H61V53H65V58H53V54H51V44Z" fill="#90849e" />
          <path d="M54 54H63V58H54Z" fill="#c6bccf" />
        </g>
        <g
          className="milo-torso"
          style={{
            transform: sitting ? "translate(5px, 1px) scale(.9, 1)" : undefined,
            transformOrigin: "45px 48px",
          }}
        >
          <path d="M27 29H34V25H52V27H63V34H66V45H62V50H31V47H25V41H23V33H27Z" fill="#71637f" />
          <path d="M28 30H36V27H53V29H61V35H63V44H59V47H33V44H28V39H26V33H28Z" fill="#b5a9c2" />
          <path d="M31 30H40V28H51V30H58V36H59V42H54V45H36V43H31Z" fill="#d5cbdc" />
          <path d="M34 29H38V37H35ZM43 28H47V34H44ZM51 30H55V35H52Z" fill="#9e8fae" />
          <path d="M31 39H35V43H40V46H33V44H30Z" fill="#9685a6" />
          <path d="M45 43H58V48H40V46H45Z" fill="#ece5ee" />
        </g>
        <g className="milo-front-leg">
          <path d="M34 40H43V53H46V59H32V55H31V44Z" fill="#bfb2cc" />
          <path d="M33 54H44V58H33Z" fill="#eee8f0" />
          <path d="M35 56v3m4-3v3" stroke="#b4a5c4" />
        </g>
        <g className="milo-front-leg second">
          <path d="M57 38H65V53H70V59H56V55H55V43Z" fill="#c8bcd3" />
          <path d="M57 54H68V58H57Z" fill="#f1eaf3" />
          <path d="M60 56v3m4-3v3" stroke="#b4a5c4" />
        </g>
        <g className="milo-head">
          <path
            d="M49 11V3H53V5H57V8H68V5H72V3H76V19H79V25H77V31H72V35H55V32H49V28H46V19H49Z"
            fill="#766580"
          />
          <path
            d="M51 13V7H54V10H59V12H67V10H71V7H74V19H76V25H74V29H70V32H56V29H51V25H49V20H51Z"
            fill="#d1c5dc"
          />
          <path d="M52 8H54V13H52ZM71 9H73V14H70V12H71Z" fill="#c793b1" />
          <path d="M56 13H69V16H72V24H69V28H57V26H53V19H56Z" fill="#eae2ed" />
          <path d="M59 12H62V18H60ZM64 12H67V17H65Z" fill="#a391b6" />
          <g className="milo-eyes">
            <path d="M54 20H60V25H54ZM67 20H73V25H67Z" fill="#44344f" />
            <path d="M56 20H59V24H56ZM69 20H72V24H69Z" fill="#b8caa8" />
            <path d="M57 20H59V24H57ZM70 20H72V24H70Z" fill="#332a3b" />
            <path d="M56 20H57V21H56ZM69 20H70V21H69Z" fill="#fff" />
          </g>
          <path d="M56 26H62V30H56ZM65 26H71V30H65Z" fill="#f5eff4" />
          <path d="M62 25H66V27H65V28H63V27H62Z" fill="#b384a1" />
          <path d="M64 28v2m-3 0h3m0 0h3" fill="none" stroke="#82667f" strokeWidth="1" />
          <path d="M45 24h8m-9 4h9m21-4h8m-8 4h9" stroke="#c5b5d3" strokeWidth="1" />
          <path d="M56 33H70V36H56Z" fill="#81719f" />
          <path d="M64 35H68V39H64Z" fill="#cdb8ef" />
          <path d="M65 36H67V37H65Z" fill="#f2e4ff" />
        </g>
      </g>
      <g className="milo-resting" style={{ opacity: resting ? 1 : 0 }}>
        <path d="M29 48H19V44H14V37H9V39H7V47H13V52H25Z" fill="#a496b5" />
        <path d="M23 46H29V40H38V37H54V41H63V46H68V54H65V58H26V56H22Z" fill="#7b6b8b" />
        <path d="M26 47H32V42H41V40H53V43H60V48H65V54H59V56H29V53H25Z" fill="#c5b7d3" />
        <path d="M33 43H37V49H34ZM42 41H46V46H43ZM51 44H55V49H52Z" fill="#9c8aaf" />
        <path d="M36 51H61V56H35Z" fill="#e0d4e8" />
        <path
          d="M56 40V29H60V32H63V35H73V32H76V29H79V41H82V48H79V53H72V56H61V53H56V49H53V43H56Z"
          fill="#867194"
        />
        <path
          d="M58 40V34H61V38H65V37H72V38H76V34H77V42H79V48H75V52H63V50H58V47H56V43H58Z"
          fill="#dbd0e3"
        />
        <path d="M65 38H68V42H65ZM71 38H74V42H71Z" fill="#b19bc3" />
        <path d="m59 44 2 2h4m6 0h4l2-2" fill="none" stroke="#58415f" strokeWidth="1.5" />
        <path d="M66 48H70V50H66Z" fill="#b68ea8" />
        <path d="M65 51h6M50 49h8m19 0h8" stroke="#a589b1" />
        <path d="M54 55H69V59H51V57H54ZM71 54H82V58H70Z" fill="#ece4f2" />
      </g>
      {action === "sleep" && (
        <g className="milo-sleep-symbol" fill="#b5a2c9" fontFamily="monospace">
          <text x="72" y="23" fontSize="7">
            z
          </text>
          <text x="79" y="15" fontSize="5">
            z
          </text>
        </g>
      )}
    </svg>
  );
}
