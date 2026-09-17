"use client";

// Hand-drawn pictograms in road-signage style: chalk figures, paint
// accents. One component per cast member, composed from a small set of
// primitives so silhouettes stay consistent.

const PAINT = "#ffb400";

type PersonOpts = {
  skirt?: boolean;
  wide?: boolean;
  small?: boolean;
  belly?: boolean;
  cane?: boolean;
  cross?: boolean;
  briefcase?: boolean;
  running?: boolean;
  band?: boolean;
};

function Person({
  skirt,
  wide,
  small,
  belly,
  cane,
  cross,
  briefcase,
  running,
  band,
}: PersonOpts) {
  const scale = small ? 0.72 : 1;
  const tx = small ? 12 * (1 - scale) : 0;
  const ty = small ? 40 * (1 - scale) : 0;
  return (
    <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
      <circle cx={cane ? 13.5 : 12} cy={cane ? 6.5 : 5} r="4" />
      {running ? (
        <>
          {/* leaning torso, driving legs, pumping arms */}
          <path d="M10 10 L16 12 L14 23 L9 21 Z" />
          <path d="M10.5 21 L5 30 L7.5 31.5 L13 24 Z" />
          <path d="M13 23 L17 32 L19.5 30.5 L16 22 Z" />
          <path d="M15 12 L21 16 L19.5 18 L13.5 14.5 Z" />
          <path d="M10.5 12 L5.5 15.5 L7 17.5 L12 14.5 Z" />
        </>
      ) : skirt ? (
        <>
          <path d={wide ? "M7 10 H17 L21 26 H3 Z" : "M9 10 H15 L18 26 H6 Z"} />
          <rect x="9.4" y="26" width="2.4" height="9" rx="1" />
          <rect x="12.2" y="26" width="2.4" height="9" rx="1" />
          <rect x={wide ? 4 : 5.6} y="11" width="2" height="9" rx="1" />
          <rect x={wide ? 18 : 16.4} y="11" width="2" height="9" rx="1" />
        </>
      ) : (
        <>
          <rect x={wide ? 6.5 : 9} y="10" width={wide ? 11 : 6} height="13" rx="2" />
          <rect x="9.2" y="23" width="2.6" height="12" rx="1" />
          <rect x="12.2" y="23" width="2.6" height="12" rx="1" />
          <rect x={wide ? 4 : 6.4} y="11" width="2.1" height="9.5" rx="1" />
          <rect x={wide ? 17.9 : 15.5} y="11" width="2.1" height="9.5" rx="1" />
        </>
      )}
      {belly && <circle cx="17" cy="15.5" r="3.4" />}
      {cane && (
        <>
          <rect x="20" y="17" width="1.8" height="17" rx="0.9" fill={PAINT} />
          <rect x="18" y="16.4" width="4.6" height="1.8" rx="0.9" fill={PAINT} />
        </>
      )}
      {cross && (
        <g fill={PAINT}>
          <rect x="10.9" y="12.5" width="2.2" height="7" />
          <rect x="8.5" y="14.9" width="7" height="2.2" />
        </g>
      )}
      {briefcase && (
        <g fill={PAINT}>
          <rect x="15.5" y="21" width="8" height="6.4" rx="1.2" />
          <rect x="18.2" y="19.4" width="2.6" height="2" rx="0.8" />
        </g>
      )}
      {band && <rect x="7.6" y="3.4" width="8.8" height="3" rx="1.2" fill={PAINT} />}
    </g>
  );
}

function Stroller() {
  return (
    <g>
      <circle cx="10" cy="10" r="3.2" />
      <path d="M4 14 H18 L16.5 23 H5.5 Z" />
      <rect x="17.5" y="8" width="1.8" height="8" rx="0.9" transform="rotate(18 18.4 12)" />
      <circle cx="8" cy="28" r="3" />
      <circle cx="15" cy="28" r="3" />
      <circle cx="8" cy="28" r="1.1" fill="#0b0c0e" />
      <circle cx="15" cy="28" r="1.1" fill="#0b0c0e" />
    </g>
  );
}

function Homeless() {
  return (
    <g>
      <circle cx="9" cy="13" r="3.6" />
      <path d="M6 17 H12.5 L12 27 H5.5 Z" />
      <rect x="5.5" y="26" width="12" height="2.8" rx="1.4" />
      <rect x="4" y="28.5" width="16" height="2" rx="1" fill={PAINT} />
      <circle cx="18.5" cy="24.5" r="3.8" />
    </g>
  );
}

function Dog() {
  return (
    <g>
      <rect x="2.5" y="20" width="15.5" height="6.5" rx="3" />
      <circle cx="19" cy="18.5" r="3.4" />
      <path d="M20.5 15.5 L22.5 12.5 L23 16 Z" />
      <rect x="4" y="26" width="2.2" height="6.5" rx="1" />
      <rect x="8" y="26" width="2.2" height="6.5" rx="1" />
      <rect x="12" y="26" width="2.2" height="6.5" rx="1" />
      <rect x="15.5" y="26" width="2.2" height="6.5" rx="1" />
      <path d="M2.8 20.5 C0.5 18.5 0.8 15.5 2.6 14.2 L4.2 16.8 Z" />
    </g>
  );
}

function Cat() {
  return (
    <g>
      <rect x="4" y="22" width="13" height="5.4" rx="2.7" />
      <circle cx="18.5" cy="20" r="3" />
      <path d="M16.4 17.6 L15.8 14.2 L18.2 16 Z" />
      <path d="M20.6 17.6 L21.2 14.2 L18.8 16 Z" />
      <rect x="5.2" y="27" width="2" height="5.6" rx="1" />
      <rect x="8.6" y="27" width="2" height="5.6" rx="1" />
      <rect x="11.8" y="27" width="2" height="5.6" rx="1" />
      <rect x="14.6" y="27" width="2" height="5.6" rx="1" />
      <path d="M4.5 23 C1.5 22 1 17.5 3.5 15.5 L5 18 C3.8 19.2 4 21 5.6 21.6 Z" />
    </g>
  );
}

const GLYPHS: Record<string, React.ReactNode> = {
  man: <Person />,
  woman: <Person skirt />,
  pregnant_woman: <Person skirt belly />,
  baby: <Stroller />,
  boy: <Person small />,
  girl: <Person small skirt />,
  elderly_man: <Person cane />,
  elderly_woman: <Person cane skirt />,
  male_doctor: <Person cross />,
  female_doctor: <Person cross skirt />,
  male_athlete: <Person running />,
  female_athlete: <Person running band />,
  male_executive: <Person briefcase />,
  female_executive: <Person briefcase skirt />,
  large_man: <Person wide />,
  large_woman: <Person wide skirt />,
  homeless: <Homeless />,
  criminal: <Person band />,
  dog: <Dog />,
  cat: <Cat />,
};

export function CharacterGlyph({
  id,
  size = 40,
  color = "var(--chalk)",
}: {
  id: string;
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size * 0.6}
      height={size}
      viewBox="0 0 24 40"
      fill={color}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {GLYPHS[id] ?? <circle cx="12" cy="20" r="8" />}
    </svg>
  );
}

// Top-view autonomous vehicle, pointed up-road
export function CarTopView({ size = 64 }: { size?: number }) {
  return (
    <svg width={size * 0.55} height={size} viewBox="0 0 22 40" aria-hidden="true">
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

// Trajectory arrows from the car into each lane
export function Trajectories({ choice }: { choice?: "A" | "B" | null }) {
  const c = (opt: "A" | "B") =>
    choice === opt ? "#e5484d" : choice ? "#3a3e46" : "var(--paint)";
  return (
    <svg viewBox="0 0 200 60" className="h-14 w-full" aria-hidden="true">
      <defs>
        <marker id="ah-a" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" fill={c("A")} />
        </marker>
        <marker id="ah-b" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" fill={c("B")} />
        </marker>
      </defs>
      <path
        d="M100 58 C 90 40, 60 30, 45 8"
        fill="none"
        stroke={c("A")}
        strokeWidth="3"
        strokeDasharray="7 6"
        markerEnd="url(#ah-a)"
      />
      <path
        d="M100 58 C 110 40, 140 30, 155 8"
        fill="none"
        stroke={c("B")}
        strokeWidth="3"
        strokeDasharray="7 6"
        markerEnd="url(#ah-b)"
      />
    </svg>
  );
}
