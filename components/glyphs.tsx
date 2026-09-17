"use client";

import { useEffect, useRef, useState } from "react";

// The cast, drawn from scratch. Skeleton construction: filled head +
// round-capped strokes for limbs (the way signage pictograms are
// actually built), so figures read solid and smooth at any size.
// Humans and animals share a 32x48 grid. Paint-yellow accents mark
// roles; everything else inherits the chalk color.

const PAINT = "#ffb400";

const S = ({ d, w = 4.2, paint = false }: { d: string; w?: number; paint?: boolean }) => (
  <path
    d={d}
    fill="none"
    stroke={paint ? PAINT : "currentColor"}
    strokeWidth={w}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

const Head = ({ cx = 16, cy = 7, r = 4.6 }: { cx?: number; cy?: number; r?: number }) => (
  <circle cx={cx} cy={cy} r={r} fill="currentColor" />
);

// ---- poses ----

function Standing({ wide = false }: { wide?: boolean }) {
  const w = wide ? 6.4 : 4.4;
  return (
    <>
      <Head />
      <S d="M16 13 V27" w={wide ? 8.5 : 6} />
      <S d="M16 15.5 L10 22.5" w={w * 0.72} />
      <S d="M16 15.5 L22 22.5" w={w * 0.72} />
      <S d="M16 26 L12 41" w={w} />
      <S d="M16 26 L20 41" w={w} />
    </>
  );
}

function Skirted({ wide = false, belly = false }: { wide?: boolean; belly?: boolean }) {
  const spread = wide ? 9 : 6.5;
  return (
    <>
      <Head />
      <S d="M16 13 V19" w={wide ? 8 : 6} />
      <S d="M16 15.5 L10 22.5" w={3.1} />
      <S d="M16 15.5 L22 22.5" w={3.1} />
      <path
        d={`M16 15 L${16 - spread} 31.5 H${16 + spread} Z`}
        fill="currentColor"
      />
      {belly && <circle cx="21" cy="21.5" r="3.6" fill="currentColor" />}
      <S d="M13.5 31 L12.5 41" w={3.6} />
      <S d="M18.5 31 L19.5 41" w={3.6} />
    </>
  );
}

function Child({ girl = false }: { girl?: boolean }) {
  return (
    <g transform="translate(16 48) scale(0.68) translate(-16 -48)">
      {girl ? <Skirted /> : <Standing />}
    </g>
  );
}

function Elderly({ skirt = false }: { skirt?: boolean }) {
  return (
    <>
      <Head cx={18.5} cy={9.5} r={4.3} />
      <S d="M18 15 Q15 20 14.5 27" w={5.6} />
      <S d="M17 18 L23 24" w={3.1} />
      {skirt ? (
        <>
          <path d="M15.5 17.5 L9.5 32 H21.5 Z" fill="currentColor" />
          <S d="M13.5 31.5 L12.5 42" w={3.4} />
          <S d="M17.5 31.5 L18 42" w={3.4} />
        </>
      ) : (
        <>
          <S d="M14.5 26.5 L11.5 42" w={4.2} />
          <S d="M14.5 26.5 L17 42" w={4.2} />
        </>
      )}
      <S d="M24.5 23.5 V43" w={2.1} paint />
      <S d="M22.3 23 H26.5" w={2.1} paint />
    </>
  );
}

function Running({ band = false }: { band?: boolean }) {
  return (
    <>
      <Head cx={19} cy={7.5} r={4.4} />
      <S d="M18 13.5 Q16 19 15 24.5" w={6} />
      <S d="M17 16 L10 12.5" w={3.2} />
      <S d="M16.5 19 L24 17" w={3.2} />
      <S d="M15 24.5 L23 30 L22 41" w={4.2} />
      <S d="M15 24.5 L10 33 L3.5 35.5" w={4.2} />
      {band && (
        <rect x="14.6" y="4.6" width="9" height="2.6" rx="1.3" fill={PAINT} />
      )}
    </>
  );
}

function Seated() {
  return (
    <>
      <Head cx={12} cy={17} r={4.3} />
      <S d="M12 22.5 V33" w={5.6} />
      <S d="M12 25.5 L18.5 30.5" w={3} />
      <S d="M12 32.5 L20.5 33.5 L20.5 42" w={4} />
      <S d="M6 42.5 H23" w={2.2} />
      <circle cx="26" cy="38" r="3.4" fill={PAINT} />
    </>
  );
}

function Stroller() {
  return (
    <>
      <path d="M6.5 14.5 A 9.5 9.5 0 0 1 16 5 L16 14.5 Z" fill="currentColor" />
      <path d="M5.5 17 H21 L18.5 27.5 H8.5 Z" fill="currentColor" />
      <S d="M20.5 17 L26.5 10" w={2.4} />
      <circle cx="10.5" cy="33.5" r="4" fill="currentColor" />
      <circle cx="18.5" cy="33.5" r="4" fill="currentColor" />
      <circle cx="10.5" cy="33.5" r="1.4" fill="#0b0c0e" />
      <circle cx="18.5" cy="33.5" r="1.4" fill="#0b0c0e" />
    </>
  );
}

function Dog() {
  return (
    <>
      <S d="M7 30 H21" w={6.5} />
      <S d="M8 31 V41" w={3} />
      <S d="M12.5 31 V41" w={3} />
      <S d="M17 31 V41" w={3} />
      <S d="M20.5 31 V41" w={3} />
      <S d="M21 29 L24.5 26.5" w={4.5} />
      <circle cx="25.5" cy="25" r="3.9" fill="currentColor" />
      <S d="M27.5 26 L30.5 26.8" w={3.4} />
      <path d="M23 21.5 Q22.3 17.5 25 16.5 Q26.6 18.8 25.8 21.8 Z" fill="currentColor" />
      <S d="M7.5 28.5 Q4 26 4.5 21.5" w={2.6} />
    </>
  );
}

function Cat() {
  return (
    <>
      <S d="M9 31.5 H20" w={5.4} />
      <S d="M9.5 32 V41" w={2.5} />
      <S d="M13 32 V41" w={2.5} />
      <S d="M16.5 32 V41" w={2.5} />
      <S d="M19.5 32 V41" w={2.5} />
      <circle cx="23.5" cy="26.5" r="3.6" fill="currentColor" />
      <path d="M20.7 24.5 L20 19.8 L23.2 22.4 Z" fill="currentColor" />
      <path d="M26.3 24.5 L27 19.8 L23.8 22.4 Z" fill="currentColor" />
      <S d="M9 30 Q3.5 29 4.5 22.5" w={2.3} />
    </>
  );
}

// ---- role accents ----

const Cross = () => (
  <g fill={PAINT}>
    <rect x="24.2" y="2" width="3" height="9" rx="0.9" />
    <rect x="21.2" y="5" width="9" height="3" rx="0.9" />
  </g>
);

const Briefcase = ({ x = 21.5, y = 25 }: { x?: number; y?: number }) => (
  <g fill={PAINT}>
    <rect x={x} y={y} width="9.5" height="7" rx="1.4" />
    <rect x={x + 3.2} y={y - 2} width="3.1" height="2.6" rx="1" />
  </g>
);

const Mask = () => <rect x="10.8" y="4.6" width="10.4" height="3.4" rx="1.5" fill={PAINT} />;

const GLYPHS: Record<string, React.ReactNode> = {
  man: <Standing />,
  woman: <Skirted />,
  pregnant_woman: <Skirted belly />,
  baby: <Stroller />,
  boy: <Child />,
  girl: <Child girl />,
  elderly_man: <Elderly />,
  elderly_woman: <Elderly skirt />,
  male_doctor: (
    <>
      <Standing />
      <Cross />
    </>
  ),
  female_doctor: (
    <>
      <Skirted />
      <Cross />
    </>
  ),
  male_athlete: <Running />,
  female_athlete: <Running band />,
  male_executive: (
    <>
      <Standing />
      <Briefcase />
    </>
  ),
  female_executive: (
    <>
      <Skirted />
      <Briefcase />
    </>
  ),
  large_man: <Standing wide />,
  large_woman: <Skirted wide />,
  homeless: <Seated />,
  criminal: (
    <>
      <Standing />
      <Mask />
    </>
  ),
  dog: <Dog />,
  cat: <Cat />,
};

// The original Moral Machine character art (MIT/Scalable Cooperation),
// mirrored locally in public/cast. The hand-drawn set above remains as
// a fallback for any id without art.
export function CharacterGlyph({
  id,
  size = 40,
  color = "var(--chalk)",
}: {
  id: string;
  size?: number;
  color?: string;
}) {
  if (GLYPHS[id]) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/cast/${id}.svg`}
        alt=""
        height={size}
        style={{ height: size, width: "auto", display: "block" }}
        draggable={false}
      />
    );
  }
  return (
    <svg
      width={size * (32 / 48)}
      height={size}
      viewBox="0 0 32 48"
      aria-hidden="true"
      style={{ display: "block", color }}
    >
      <circle cx="16" cy="24" r="10" fill="currentColor" />
    </svg>
  );
}

// Concrete barrier with hazard cap (MM's bucket has no barrier asset;
// this one is ours, consistent with the hazard styling)
export function Barrier({ height = 36 }: { height?: number }) {
  return (
    <svg
      viewBox="0 0 140 36"
      style={{ height, width: "auto", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="hzp"
          width="14"
          height="14"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <rect width="14" height="14" fill="#ffb400" />
          <rect x="7" width="7" height="14" fill="#14161a" />
        </pattern>
      </defs>
      <rect x="1" y="5" width="138" height="12" rx="2" fill="url(#hzp)" stroke="#0b0c0e" />
      <rect x="1" y="17" width="138" height="14" rx="2" fill="#4a4f58" />
      <rect x="10" y="31" width="18" height="4" rx="1" fill="#33373e" />
      <rect x="112" y="31" width="18" height="4" rx="1" fill="#33373e" />
    </svg>
  );
}

// Top-view autonomous vehicle; down = travelling toward the bottom
// of the page
export function CarTopView({ size = 64, down = false }: { size?: number; down?: boolean }) {
  return (
    <svg
      width={size * 0.55}
      height={size}
      viewBox="0 0 22 40"
      aria-hidden="true"
      style={down ? { transform: "rotate(180deg)" } : undefined}
    >
      <rect x="3" y="2" width="16" height="36" rx="6" fill={PAINT} />
      <rect x="5.5" y="8" width="11" height="7" rx="2.5" fill="#0b0c0e" opacity="0.85" />
      <rect x="5.5" y="27" width="11" height="5.5" rx="2.5" fill="#0b0c0e" opacity="0.6" />
      <rect x="0.8" y="6" width="2.4" height="7" rx="1.2" fill="#2c2e33" />
      <rect x="18.8" y="6" width="2.4" height="7" rx="1.2" fill="#2c2e33" />
      <rect x="0.8" y="27" width="2.4" height="7" rx="1.2" fill="#2c2e33" />
      <rect x="18.8" y="27" width="2.4" height="7" rx="1.2" fill="#2c2e33" />
      <rect x="5" y="2.2" width="3" height="2" rx="1" fill="#fff8" />
      <rect x="14" y="2.2" width="3" height="2" rx="1" fill="#fff8" />
    </svg>
  );
}

// The car sits in the straight lane (under A); staying goes dead
// ahead, swerving crosses the divider into B. Drawn in pixel space
// from the measured container width, so nothing stretches.
export function Trajectories({ choice }: { choice?: "A" | "B" | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const c = (opt: "A" | "B") =>
    choice === opt ? "#e5484d" : choice ? "#3a3e46" : "var(--paint)";
  const h = 56;
  const xa = w * 0.25;
  const xb = w * 0.75;
  return (
    <div ref={ref} className="h-14 w-full" aria-hidden="true">
      {w > 0 && (
        <svg width={w} height={h}>
          <defs>
            <marker
              id="ah-a"
              markerUnits="userSpaceOnUse"
              markerWidth="11"
              markerHeight="11"
              refX="5.5"
              refY="5.5"
              orient="auto"
            >
              <path d="M0 0 L11 5.5 L0 11 Z" fill={c("A")} />
            </marker>
            <marker
              id="ah-b"
              markerUnits="userSpaceOnUse"
              markerWidth="11"
              markerHeight="11"
              refX="5.5"
              refY="5.5"
              orient="auto"
            >
              <path d="M0 0 L11 5.5 L0 11 Z" fill={c("B")} />
            </marker>
          </defs>
          <path
            d={`M${xa} 4 L${xa} ${h - 12}`}
            fill="none"
            stroke={c("A")}
            strokeWidth="2.5"
            strokeDasharray="7 6"
            markerEnd="url(#ah-a)"
          />
          <path
            d={`M${xa} 4 C ${xa} ${h * 0.9}, ${xb} ${h * 0.05}, ${xb} ${h - 12}`}
            fill="none"
            stroke={c("B")}
            strokeWidth="2.5"
            strokeDasharray="7 6"
            markerEnd="url(#ah-b)"
          />
        </svg>
      )}
    </div>
  );
}
