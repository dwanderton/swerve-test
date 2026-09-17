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
    g.gain.value = 0.04;
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
    dg.gain.value = 0.016;
    drone.connect(dg).connect(amb);
    drone.start();

    // distant traffic passing by, every so often
    const passBy = () => {
      if (!this.ctx) return;
      this.whoosh(this.ctx.currentTime, 1.6, 0.03);
      setTimeout(passBy, 18_000 + Math.random() * 22_000);
    };
    setTimeout(passBy, 8_000);
  }

  // a vehicle sweeping past: broad noise swell through a moving band
  private whoosh(at: number, dur = 0.9, peak = 0.05) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise();
    src.loop = true;
    src.playbackRate.value = 1.4;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.7;
    bp.frequency.setValueAtTime(240, at);
    bp.frequency.exponentialRampToValueAtTime(620, at + dur * 0.45);
    bp.frequency.exponentialRampToValueAtTime(180, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(bp).connect(g).connect(this.master!);
    src.start(at);
    src.stop(at + dur + 0.1);
  }

  // a new dilemma rolls onto the road: engine approach, no beeps
  approach() {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    this.whoosh(ctx.currentTime, 1.1, 0.055);
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
    g.gain.exponentialRampToValueAtTime(0.34, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
    src.connect(lp).connect(g).connect(this.master!);
    src.start(at);
    src.stop(at + 0.9);

    const thump = ctx.createOscillator();
    thump.frequency.setValueAtTime(52, at);
    thump.frequency.exponentialRampToValueAtTime(26, at + 0.4);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.0001, at);
    tg.gain.exponentialRampToValueAtTime(0.3, at + 0.01);
    tg.gain.exponentialRampToValueAtTime(0.0001, at + 0.6);
    thump.connect(tg).connect(this.master!);
    thump.start(at);
    thump.stop(at + 0.7);

    // the stamp itself: a short dry thwack over the impact
    const slap = ctx.createBufferSource();
    slap.buffer = this.noise();
    slap.playbackRate.value = 3;
    const hp = ctx.createBiquadFilter();
    hp.type = "bandpass";
    hp.frequency.value = 900;
    hp.Q.value = 1.2;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, at + 0.02);
    sg.gain.exponentialRampToValueAtTime(0.16, at + 0.03);
    sg.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
    slap.connect(hp).connect(sg).connect(this.master!);
    slap.start(at + 0.02);
    slap.stop(at + 0.15);
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
