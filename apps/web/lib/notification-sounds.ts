let audioCtx: AudioContext | null = null;
let ringInterval: ReturnType<typeof setInterval> | null = null;
let ringOscillators: OscillatorNode[] = [];

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

async function resumeCtx(ctx: AudioContext): Promise<void> {
  if (ctx.state === "suspended") await ctx.resume();
}

function playTone(
  frequency: number,
  duration: number,
  volume = 0.15,
  type: OscillatorType = "sine",
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  void resumeCtx(ctx).then(() => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  });
}

export function playMessageSound(): void {
  playTone(880, 0.08, 0.12);
  setTimeout(() => playTone(1174, 0.1, 0.1), 90);
}

export function startCallRing(): () => void {
  stopCallRing();

  const ctx = getAudioContext();
  if (!ctx) return () => {};

  const ring = () => {
    void resumeCtx(ctx).then(() => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.value = 440;
      osc2.frequency.value = 480;
      gain.gain.value = 0.18;
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.9);
      osc2.stop(ctx.currentTime + 0.9);
      ringOscillators.push(osc1, osc2);
    });
  };

  ring();
  ringInterval = setInterval(ring, 2000);

  return stopCallRing;
}

export function stopCallRing(): void {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
  for (const osc of ringOscillators) {
    try {
      osc.stop();
    } catch {
      // already stopped
    }
  }
  ringOscillators = [];
}
