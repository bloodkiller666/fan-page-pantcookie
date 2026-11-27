// Voice for the event. Order of preference, and none of them can block the experience:
//   1. pre-generated audio:  /audio/event/<id>.mp3, then .wav
//   2. the browser's own speech synthesis
//   3. silence, with the subtitle timed as if it were read aloud
// Browsers only allow sound after a user gesture, so the first call must come from a click.

const MUTE_KEY = 'evento_voz_silenciada';
const EXTENSIONS = ['mp3', 'wav'] as const;

export interface VoiceHandle {
    /** Resolves when the line has finished, was stopped, or could not be played. */
    done: Promise<void>;
    stop: () => void;
}

let active: VoiceHandle | null = null;

export const isVoiceMuted = (): boolean => {
    try {
        return localStorage.getItem(MUTE_KEY) === '1';
    } catch {
        return false;
    }
};

export const setVoiceMuted = (muted: boolean) => {
    try {
        localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
        /* storage unavailable: the choice just won't persist */
    }
    if (muted) stopVoice();
};

export const stopVoice = () => {
    active?.stop();
    active = null;
};

/** Reading time used when there is no audio to measure. */
const estimateMs = (text: string) => Math.max(1800, text.length * 62);

export function speak(id: string, text: string, onDuration?: (ms: number) => void): VoiceHandle {
    stopVoice();

    let finished = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let audio: HTMLAudioElement | null = null;
    let resolveDone: () => void = () => {};
    const done = new Promise<void>((resolve) => (resolveDone = resolve));

    const finish = () => {
        if (finished) return;
        finished = true;
        if (timer) clearTimeout(timer);
        resolveDone();
    };

    const silent = () => {
        const ms = estimateMs(text);
        onDuration?.(ms);
        timer = setTimeout(finish, ms);
    };

    const synth = () => {
        const synthesis = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
        if (!synthesis) return silent();
        try {
            synthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = synthesis.getVoices();
            const voice = voices.find((v) => /es[-_]MX/i.test(v.lang)) || voices.find((v) => /^es/i.test(v.lang));
            if (voice) utterance.voice = voice;
            utterance.lang = voice?.lang || 'es-MX';
            utterance.onend = finish;
            utterance.onerror = finish;
            onDuration?.(estimateMs(text));
            synthesis.speak(utterance);
            // Some browsers never fire onend for blocked speech
            timer = setTimeout(finish, estimateMs(text) + 4000);
        } catch {
            silent();
        }
    };

    const handle: VoiceHandle = {
        done,
        stop: () => {
            audio?.pause();
            try {
                window.speechSynthesis?.cancel();
            } catch {
                /* nothing to cancel */
            }
            finish();
        },
    };
    active = handle;

    if (isVoiceMuted()) {
        silent();
        return handle;
    }

    let attempt = 0;
    const tryNext = () => {
        if (finished) return;
        if (attempt >= EXTENSIONS.length) return synth();
        const el = new Audio(`/audio/event/${id}.${EXTENSIONS[attempt++]}`);
        audio = el;
        el.preload = 'auto';
        el.onloadedmetadata = () => {
            if (Number.isFinite(el.duration)) onDuration?.(el.duration * 1000);
        };
        el.onended = finish;
        el.onerror = tryNext;
        el.play().catch(() => {
            // Not a missing file: the browser refused to play (no gesture yet). Fall back, never hang.
            if (!finished && el.error == null) synth();
        });
    };
    tryNext();

    return handle;
}
