"use client";

import { useEffect, useState } from "react";
import { audio } from "@/lib/audio";

export default function SoundToggle() {
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem("swerve-muted");
    const m = stored === null ? false : stored === "1";
    setMuted(m);
    audio.setMuted(m);
    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
  return (
    <button
      onClick={() => {
        const next = !muted;
        setMuted(next);
        audio.setMuted(next);
        localStorage.setItem("swerve-muted", next ? "1" : "0");
        audio.unlock();
      }}
      className="text-[11px] tracking-[0.24em] text-ink-muted hover:text-paint"
    >
      {muted ? "🔇 SOUND" : "🔊 SOUND"}
    </button>
  );
}
