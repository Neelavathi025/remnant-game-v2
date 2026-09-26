export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    } catch (error) {
      console.warn('Audio unavailable', error);
    }
  }

  startAmbient() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  playSfx(type) {
    if (!this.enabled || !this.ctx) return;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = type === 'interaction' ? 'triangle' : 'sine';
    oscillator.frequency.value = type === 'interaction' ? 240 : 180;
    gain.gain.value = 0.02;

    oscillator.connect(gain);
    gain.connect(this.ctx.destination);
    oscillator.start();
    oscillator.stop(this.ctx.currentTime + 0.08);
  }
}
