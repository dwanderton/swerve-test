// All sound is synthesized with Web Audio - no asset files. The
// context can only start after a user gesture; unlock() is wired to
// the first pointer/key event and is a no-op afterwards.

class SwerveAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private muted = false;

  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.startAmbient();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  get isMuted() {
    return this.muted;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05);
    }
  }

  private noise(): AudioBuffer {
    const ctx = this.ctx!;
    if (this.noiseBuf) return this.noiseBuf;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    this.noiseBuf = buf;
    return buf;
  }

  // distant road hum: filtered rolling noise + a faint low drone
  private startAmbient() {
    const ctx = this.ctx!;
    const amb = ctx.createGain();
    amb.gain.value = 0;
    amb.connect(this.master!);
    amb.gain.setTargetAtTime(1, ctx.currentTime, 2.5);

    const src = ctx.createBufferSource();
    src.buffer = this.noise();
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 160;
    const g = ctx.createGain();
    g.gain.value = 0.028;
    src.connect(lp).connect(g).connect(amb);
    src.start();
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain).connect(g.gain);
    lfo.start();

    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 48;
    const dg = ctx.createGain();
    dg.gain.value = 0.014;
    drone.connect(dg).connect(amb);
    drone.start();
  }

  // crosswalk ticks: a new dilemma is on the road
  approach() {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    for (let i = 0; i < 3; i++) {
      const t = ctx.currentTime + i * 0.14;
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = 1750;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.028, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      osc.connect(g).connect(this.master);
      osc.start(t);
      osc.stop(t + 0.08);
    }
  }

  private screech(at: number, dur = 0.45) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise();
    src.playbackRate.value = 2.4;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 6;
    bp.frequency.setValueAtTime(2600, at);
    bp.frequency.exponentialRampToValueAtTime(1200, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.05, at + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(bp).connect(g).connect(this.master!);
    src.start(at);
    src.stop(at + dur + 0.05);
  }

  private impact(at: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise();
    src.playbackRate.value = 0.8;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(160, at);
    lp.frequency.exponentialRampToValueAtTime(45, at + 0.7);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.16, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.8);
    src.connect(lp).connect(g).connect(this.master!);
    src.start(at);
    src.stop(at + 0.9);

    const thump = ctx.createOscillator();
    thump.frequency.setValueAtTime(52, at);
    thump.frequency.exponentialRampToValueAtTime(26, at + 0.4);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.0001, at);
    tg.gain.exponentialRampToValueAtTime(0.14, at + 0.012);
    tg.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
    thump.connect(tg).connect(this.master!);
    thump.start(at);
    thump.stop(at + 0.6);
  }

  // the verdict: swerving screeches first, then the hit and the stamp
  verdict(choice: "A" | "B") {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    if (choice === "B") {
      this.screech(now);
      this.impact(now + 0.4);
    } else {
      this.impact(now + 0.05);
    }
  }
}

export const audio = new SwerveAudio();
