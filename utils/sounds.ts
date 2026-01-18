
let audioCtx: AudioContext | null = null;
let musicInterval: any = null;
let musicGain: GainNode | null = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const startBackgroundMusic = () => {
  const ctx = getCtx();
  if (musicInterval) return;

  musicGain = ctx.createGain();
  musicGain.gain.setValueAtTime(0.05, ctx.currentTime);
  musicGain.connect(ctx.destination);

  let step = 0;
  const bpm = 110;
  const stepTime = 60 / bpm / 2;

  musicInterval = setInterval(() => {
    const time = ctx.currentTime;
    
    // Simple Tabla-like "Tak" (High freq)
    if (step % 2 === 0) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, time);
      osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);
      g.gain.setValueAtTime(0.2, time);
      g.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      osc.connect(g);
      g.connect(musicGain!);
      osc.start(time);
      osc.stop(time + 0.1);
    }

    // Deep "Dhun" (Bass)
    if (step % 4 === 0) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.2);
      g.gain.setValueAtTime(0.4, time);
      g.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      osc.connect(g);
      g.connect(musicGain!);
      osc.start(time);
      osc.stop(time + 0.2);
    }

    // Melodic "Flute" like chirp
    if (step % 8 === 0 || step === 3 || step === 11) {
      const notes = [440, 493, 523, 587, 659];
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      g.gain.setValueAtTime(0.1, time);
      g.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
      osc.connect(g);
      g.connect(musicGain!);
      osc.start(time);
      osc.stop(time + 0.3);
    }

    step = (step + 1) % 16;
  }, stepTime * 1000);
};

export const stopBackgroundMusic = () => {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
  if (musicGain) {
    musicGain.gain.exponentialRampToValueAtTime(0.001, getCtx().currentTime + 0.5);
  }
};

export const playPop = () => {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};

export const playSwap = () => {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
};

export const playSpecial = () => {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(100, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(50, ctx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc2.start();
  osc.stop(ctx.currentTime + 0.3);
  osc2.stop(ctx.currentTime + 0.3);
};

export const playWin = () => {
  const ctx = getCtx();
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.3);
  });
};

export const playLose = () => {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
};
