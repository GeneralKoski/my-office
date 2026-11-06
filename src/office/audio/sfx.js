// Sounds, synthesized in the browser.
import { reduceMotion } from '../core/env.js';

export let sfx;

export function setup() {
  /* ---------- sounds: synthesized in the browser (no files), each kind rate-limited, muted with one switch ---------- */
  sfx = (() => {
    let ctx = null, on = true;
    try { on = localStorage.getItem('office-sound') !== 'off'; } catch { /* storage blocked */ }
    const last = new Map();
    const unlock = () => { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* no audio */ } } if (ctx?.state === 'suspended') ctx.resume(); };
    addEventListener('pointerdown', unlock, { passive: true }); addEventListener('keydown', unlock);
    const tone = (f, t0, dur, type = 'sine', vol = 0.15, f2 = null) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
    };
    const noise = (t0, dur, vol = 0.05, hp = 1800) => {
      const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'highpass'; f.frequency.value = hp; g.gain.value = vol; s.buffer = b; s.connect(f).connect(g).connect(ctx.destination); s.start(t0);
    };
    const SOUNDS = {
      perm: (t) => { tone(880, t, 0.16, 'triangle', 0.16); tone(1175, t + 0.13, 0.22, 'triangle', 0.14); },
      turn: (t) => { tone(659, t, 0.18, 'sine', 0.12); tone(988, t + 0.12, 0.3, 'sine', 0.1); },
      key: (t) => noise(t, 0.03, 0.025, 3500),
      deploy: (t) => { tone(220, t, 1.1, 'sawtooth', 0.05, 880); noise(t, 1.1, 0.04, 400); },
      siren: (t) => { for (let i = 0; i < 3; i++) { tone(620, t + i * 0.6, 0.3, 'square', 0.05, 880); tone(880, t + i * 0.6 + 0.3, 0.3, 'square', 0.05, 620); } },
    };
    const GAP = { key: 0.18, perm: 1, turn: 1.5, deploy: 3, siren: 4 };
    return {
      get on() { return on; },
      set(v) { on = v; try { localStorage.setItem('office-sound', v ? 'on' : 'off'); } catch { /* storage blocked */ } if (v) unlock(); },
      play(name) {
        if (!on || !ctx || ctx.state !== 'running' || reduceMotion && name === 'key') return;
        const now = ctx.currentTime; if (now - (last.get(name) ?? -9) < (GAP[name] || 0.2)) return;
        last.set(name, now); SOUNDS[name]?.(now + 0.01);
      },
    };
  })();
}
