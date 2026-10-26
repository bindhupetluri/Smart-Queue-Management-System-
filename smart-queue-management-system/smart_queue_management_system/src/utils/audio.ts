/**
 * Web Speech API and Audio Synthesizer for Queue Callout System
 */

class SoundEffects {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play pleasant two-tone airport/hospital chime (ding-dong)
  public playChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // First tone (G4)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(392.00, now); // G4
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Second tone (C5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.3); // C5
      gain2.gain.setValueAtTime(0.35, now + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.3);
      osc2.stop(now + 1.1);
    } catch (e) {
      console.warn('Audio chime playback error:', e);
    }
  }

  // Voice announcement: "Token OPD 107, please proceed to Counter 1"
  public speakToken(tokenNumber: string, counterNumber?: number | string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      this.playChime();

      setTimeout(() => {
        window.speechSynthesis.cancel(); // Stop prior speeches

        // Format token number for natural reading (e.g., "O P D 1 0 7")
        const letters = tokenNumber.replace(/[^A-Za-z]/g, '').split('').join(' ');
        const digits = tokenNumber.replace(/[^0-9]/g, '').split('').join(' ');
        const spokenToken = `${letters} ${digits}`;

        const counterText = counterNumber ? `please proceed to Counter ${counterNumber}` : 'your turn has arrived';
        const utterance = new SpeechSynthesisUtterance(`Attention please, Token ${spokenToken}, ${counterText}`);
        utterance.rate = 0.92;
        utterance.pitch = 1.05;
        utterance.lang = 'en-US';

        window.speechSynthesis.speak(utterance);
      }, 650);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }
}

export const soundEffects = new SoundEffects();
