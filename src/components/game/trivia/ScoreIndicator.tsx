import { useEffect, useState } from 'react';

interface ScoreIndicatorProps {
    points: number;
    onComplete: () => void;
}

/** Floating "+5" / "-2" that drifts up and fades after an answer. */
export default function ScoreIndicator({ points, onComplete }: ScoreIndicatorProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onComplete, 300);
        }, 1500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    const tone = points > 0 ? 'bg-[var(--cyan)] text-[var(--ink)]' : points < 0 ? 'bg-[var(--pink)] text-[var(--ink)]' : 'bg-[var(--surface-2)] text-[var(--text)]';

    return (
        <span
            aria-hidden
            className={`score pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 border-2 border-[var(--ink)] px-2 py-1 text-[0.6rem] transition-all duration-1000 ${tone} ${visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}
        >
            {points > 0 ? `+${points}` : points}
        </span>
    );
}
