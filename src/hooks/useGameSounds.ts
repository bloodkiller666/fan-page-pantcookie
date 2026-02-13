import { useCallback, useEffect, useRef } from 'react';

export const useGameSounds = () => {
    const audioContext = useRef<AudioContext | null>(null);

    useEffect(() => {
        const initAudio = () => {
            if (!audioContext.current) {
                audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
        };

        window.addEventListener('click', initAudio, { once: true });
        window.addEventListener('keydown', initAudio, { once: true });

        return () => {
            window.removeEventListener('click', initAudio);
            window.removeEventListener('keydown', initAudio);
        };
    }, []);

    const playTone = useCallback((freq: number, type: OscillatorType, duration: number, startTime: number = 0, vol: number = 0.1) => {
        if (!audioContext.current) return;
        const ctx = audioContext.current;

        // Resume context if suspended (browser policy)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

        gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
    }, []);

    const playClick = useCallback(() => {
        // Soft UI Click (Glassy)
        playTone(1200, 'sine', 0.05, 0, 0.05);
    }, [playTone]);

    const playSelect = useCallback(() => {
        // Futuristic Select (High pitch sine)
        playTone(1800, 'sine', 0.1, 0, 0.05);
    }, [playTone]);

    const playCountdown = useCallback((count: number) => {
        if (count > 0) {
            // Beep (3, 2, 1) - Sharp metallic beep
            playTone(880, 'sine', 0.15, 0, 0.1);
            playTone(1760, 'triangle', 0.05, 0, 0.05); // Harmonic
        } else {
            // GO! - High energy chord
            playTone(1046.50, 'square', 0.4, 0, 0.1); // C6
            playTone(1318.51, 'square', 0.4, 0, 0.1); // E6
            playTone(1567.98, 'square', 0.4, 0, 0.1); // G6
        }
    }, [playTone]);

    const playCorrect = useCallback(() => {
        // Success Chime (Sparkle)
        playTone(1046.50, 'sine', 0.2, 0, 0.1);      // C6
        playTone(1318.51, 'sine', 0.2, 0.05, 0.1);   // E6
        playTone(1567.98, 'sine', 0.3, 0.1, 0.1);    // G6
        playTone(2093.00, 'sine', 0.5, 0.15, 0.1);   // C7
    }, [playTone]);

    const playIncorrect = useCallback(() => {
        if (!audioContext.current) return;
        const ctx = audioContext.current;
        if (ctx.state === 'suspended') ctx.resume();

        // Error "Thud" / Glitch
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth'; // Rougher sound
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }, []);

    const playVictory = useCallback(() => {
        // Grand Fanfare
        const now = 0;
        playTone(523.25, 'triangle', 0.15, now, 0.2); // C5
        playTone(523.25, 'triangle', 0.15, now + 0.15, 0.2);
        playTone(523.25, 'triangle', 0.15, now + 0.30, 0.2);
        playTone(659.25, 'triangle', 0.4, now + 0.45, 0.2); // E5
        playTone(783.99, 'triangle', 0.4, now + 0.60, 0.2); // G5
        playTone(1046.50, 'triangle', 0.8, now + 0.80, 0.2); // C6

        // Bass layer
        playTone(261.63, 'sawtooth', 1.0, now + 0.45, 0.1); // C4
    }, [playTone]);

    const playSwap = useCallback(() => {
        // Quick Swoosh
        playTone(400, 'sine', 0.1, 0, 0.05);
    }, [playTone]);

    return {
        playClick,
        playSelect,
        playCorrect,
        playIncorrect,
        playVictory,
        playSwap,
        playCountdown
    };
};
