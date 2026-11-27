import { MdOpenInFull } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';

export interface WallMessage {
    id: string;
    username: string;
    country: string;
    text: string;
    image: string | null;
    timestamp: string;
}

const TONES = ['', 'cart--cyan', 'cart--yellow', 'cart--pink'] as const;

interface MessageCardProps {
    message: Pick<WallMessage, 'username' | 'country' | 'text' | 'image' | 'timestamp'>;
    index: number;
    /** Opens the full message. Omit for the non-interactive form preview. */
    onOpen?: () => void;
}

/** One postcard on the wall. The colour cycles with its position. */
export default function MessageCard({ message, index, onOpen }: MessageCardProps) {
    const { t } = useLanguage();
    const tone = TONES[index % TONES.length];
    const interactive = !!onOpen;

    const body = (
        <div className={`cart-shell ${interactive ? 'is-interactive' : ''}`}>
            <div className={`cart ${tone}`}>
                <div className="cart__face flex flex-col">
                    <div className="flex items-center gap-3 border-b-[3px] border-[var(--line)] px-5 py-4 [--line:var(--ink)]">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--yellow)] font-display text-xl font-bold uppercase text-[var(--ink)]" aria-hidden>
                            {(message.username || '?').charAt(0)}
                        </span>
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate font-display text-xl font-bold uppercase leading-none">{message.username}</h3>
                            <p className="mt-1 truncate font-display text-xs font-bold uppercase tracking-[0.14em] opacity-70">{message.country}</p>
                        </div>
                        {interactive && <MdOpenInFull className="shrink-0 text-xl opacity-60" aria-label={t('wall.expand')} />}
                    </div>

                    {message.image && (
                        <div className="border-b-[3px] border-[var(--ink)] bg-[var(--ink)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={message.image} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                        </div>
                    )}

                    <p className="line-clamp-[8] whitespace-pre-wrap break-words px-5 py-5 text-lg font-semibold leading-relaxed">&ldquo;{message.text}&rdquo;</p>

                    <p className="mt-auto px-5 pb-4 font-display text-xs font-bold uppercase tracking-[0.12em] opacity-60">{message.timestamp}</p>
                    <div className="pins" aria-hidden />
                </div>
            </div>
        </div>
    );

    if (!onOpen) return body;
    return (
        <button type="button" onClick={onOpen} className="block w-full text-left outline-offset-8">
            {body}
        </button>
    );
}
