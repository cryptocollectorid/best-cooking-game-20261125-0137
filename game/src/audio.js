// Tiny synthesized sounds for Wok & Ember: a wok sizzle, a serve ding,
// a mistake buzz. No audio files, everything is WebAudio oscillators
// and filtered noise, so the game stays static files only.
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  ensure() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  tone(freq, seconds, type = 'sine', gain = 0.12, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(0, t0);
    amp.gain.linearRampToValueAtTime(gain, t0 + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(amp);
    amp.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  chop() {
    this.tone(320, 0.07, 'triangle', 0.1);
    this.tone(180, 0.06, 'square', 0.05, 0.02);
  }

  ding() {
    this.tone(880, 0.18, 'sine', 0.14);
    this.tone(1318, 0.3, 'sine', 0.1, 0.09);
  }

  buzz() {
    this.tone(140, 0.22, 'sawtooth', 0.08);
    this.tone(110, 0.25, 'sawtooth', 0.06, 0.05);
  }

  plated() {
    this.tone(523, 0.12, 'sine', 0.12);
    this.tone(784, 0.2, 'sine', 0.1, 0.08);
  }

  startSizzle() {
    if (!this.ctx || this.muted || this.sizzleNodes) return;
    const length = this.ctx.sampleRate * 1;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4200;
    filter.Q.value = 0.6;
    const amp = this.ctx.createGain();
    amp.gain.value = 0.035;
    source.connect(filter);
    filter.connect(amp);
    amp.connect(this.ctx.destination);
    source.start();
    this.sizzleNodes = { source, amp };
  }

  stopSizzle() {
    if (!this.sizzleNodes) return;
    try {
      this.sizzleNodes.source.stop();
    } catch {
      // Already stopped.
    }
    this.sizzleNodes = null;
  }
}
