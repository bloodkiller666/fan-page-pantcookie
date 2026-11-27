'use client';
import { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { MdAttachFile, MdClose, MdMood, MdPerson, MdSend, MdVolumeOff, MdVolumeUp } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';

const LOGO = 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png';
const MAX_INACTIVITY_TIME = 3 * 60 * 1000; // 3 minutes

interface ChatMessage {
    id: number;
    /** `welcome` is rendered from the current language, so it follows language changes. */
    kind: 'welcome' | 'text';
    text: string | null;
    sender: 'user' | 'bot';
    fileUrl: string | null;
    fileName: string | null;
    time: Date;
}

interface PendingImage {
    url: string;
    base64: string;
    name: string;
}

const ChatInterface = () => {
    const { t, language } = useLanguage();
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 1, kind: 'welcome', text: null, sender: 'bot', time: new Date(), fileUrl: null, fileName: null },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [status, setStatus] = useState<'online' | 'offline'>('online');
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [botIntensity, setBotIntensity] = useState(0.8);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [inputValue]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [messages, isTyping, showEmojiPicker, pendingImage]);

    const addMessage = (text: string | null, sender: 'user' | 'bot', fileUrl: string | null = null, fileName: string | null = null) => {
        setMessages((prev) => [...prev, { id: Date.now() + prev.length, kind: 'text', text, sender, fileUrl, fileName, time: new Date() }]);
    };

    const handleTimeout = () => {
        setStatus('offline');
        addMessage(t('chat.resting'), 'bot');
    };

    const resetTimers = () => {
        if (status === 'offline') return;
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = setTimeout(handleTimeout, MAX_INACTIVITY_TIME);
    };

    useEffect(() => {
        resetTimers();
        return () => {
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const speakText = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();

        const cleanText = text.replace(/([✀-➿]|[-]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[‑-⛿]|\uD83E[\uDD10-\uDDFF])/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();

        const preferredVoices = ['Microsoft Elena', 'Microsoft Laura', 'Google español', 'Monica', 'Paulina'];
        let selectedVoice: SpeechSynthesisVoice | undefined | null = null;
        for (const name of preferredVoices) {
            selectedVoice = voices.find((v) => v.name.includes(name));
            if (selectedVoice) break;
        }
        if (!selectedVoice) {
            selectedVoice = voices.find((v) => v.lang.toLowerCase().includes('es') || v.lang.toLowerCase().includes('spa'));
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            if (selectedVoice.name.includes('Microsoft')) {
                utterance.rate = 1.05;
                utterance.pitch = 1.0;
            } else {
                utterance.rate = 1.1;
                utterance.pitch = 1.1;
            }
        }
        window.speechSynthesis.speak(utterance);
    };

    const toggleSound = () => {
        setIsSoundEnabled((on) => {
            if (on) window.speechSynthesis?.cancel();
            return !on;
        });
    };

    /** Send `userText` (and an optional image) to the bot and render its reply. */
    const submit = async (userText: string, imageToSend: PendingImage | null) => {
        if ((!userText.trim() && !imageToSend) || status === 'offline') return;

        setInputValue('');
        setPendingImage(null);
        setShowEmojiPicker(false);

        addMessage(userText || null, 'user', imageToSend?.url ?? null, imageToSend?.name ?? null);
        resetTimers();
        setIsTyping(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    imageUrl: imageToSend?.base64,
                    intensity: botIntensity,
                    lang: language,
                }),
            });
            if (!response.ok) {
                setIsTyping(false);
                addMessage(t('chat.serverError'), 'bot');
                return;
            }
            let data: { response?: unknown; newIntensity?: number } | null = null;
            try {
                if ((response.headers.get('content-type') || '').includes('application/json')) {
                    data = await response.json();
                }
            } catch {
                data = null;
            }
            setIsTyping(false);
            if (!data || typeof data.response !== 'string') {
                addMessage(t('chat.parseError'), 'bot');
                return;
            }

            if (data.newIntensity !== undefined) setBotIntensity(data.newIntensity);

            if (data.response === 'EXIT') {
                addMessage(t('chat.exitMessage'), 'bot');
                if (isSoundEnabled) speakText(t('chat.exitMessage'));
                setStatus('offline');
                if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            } else {
                addMessage(data.response, 'bot');
                if (isSoundEnabled) speakText(data.response);
            }
        } catch (error) {
            console.error('Chat Error:', error);
            setIsTyping(false);
            addMessage(t('chat.connectionError'), 'bot');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || status === 'offline') return;

        if (file.size > 5 * 1024 * 1024) {
            addMessage(t('chat.imageSizeError'), 'bot');
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPendingImage({ url: URL.createObjectURL(file), base64: reader.result as string, name: file.name });
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.onerror = () => {
            setIsUploading(false);
            addMessage(t('chat.imageReadError'), 'bot');
        };
        reader.readAsDataURL(file);
    };

    const formatTime = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    const isOffline = status === 'offline';
    const suggestions = [t('chat.suggest1'), t('chat.suggest2'), t('chat.suggest3')];
    const showSuggestions = messages.length === 1 && !isOffline;

    return (
        <div className="flex h-full min-h-0 w-full flex-col">
            {/* Header */}
            <header className="flex items-center justify-between gap-4 border-[3px] border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-[5px_5px_0_var(--shadow)]">
                <div className="flex items-center gap-3">
                    <span className="relative block h-12 w-12 shrink-0 overflow-hidden border-[3px] border-[var(--line)] bg-[var(--pink)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={LOGO} alt="" className="h-full w-full object-cover" />
                    </span>
                    <div>
                        <h1 className="font-display text-xl font-bold uppercase leading-none">{t('chat.welcomeName')}</h1>
                        <p className={`tag mt-2 ${isOffline ? '' : 'tag--cyan'}`}>{isOffline ? t('chat.offline') : t('chat.online')}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={toggleSound}
                    aria-pressed={isSoundEnabled}
                    aria-label={isSoundEnabled ? t('chat.soundOn') : t('chat.soundOff')}
                    title={isSoundEnabled ? t('chat.soundOn') : t('chat.soundOff')}
                    className={`flex h-11 w-11 items-center justify-center border-[3px] border-[var(--line)] transition-colors ${isSoundEnabled ? 'bg-[var(--cyan)] text-[var(--ink)]' : 'bg-[var(--surface-2)]'}`}
                >
                    {isSoundEnabled ? <MdVolumeUp className="text-2xl" /> : <MdVolumeOff className="text-2xl" />}
                </button>
            </header>

            {/* Messages */}
            <div ref={scrollContainerRef} role="log" aria-live="polite" className="min-h-0 flex-1 space-y-6 overflow-y-auto px-1 py-6 sm:px-4">
                {messages.map((msg) => {
                    const mine = msg.sender === 'user';
                    const text = msg.kind === 'welcome' ? t('chat.welcomeMessage') : msg.text;
                    return (
                        <div key={msg.id} className={`flex items-start gap-3 ${mine ? 'justify-end' : 'justify-start'}`}>
                            {!mine && (
                                <span className="relative block h-10 w-10 shrink-0 overflow-hidden border-[3px] border-[var(--line)] bg-[var(--pink)]" aria-hidden>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={LOGO} alt="" className="h-full w-full object-cover" />
                                </span>
                            )}

                            <div className={`flex max-w-[82%] flex-col gap-1.5 ${mine ? 'items-end' : ''}`}>
                                <span className="font-display text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{mine ? t('chat.you') : t('chat.welcomeName')}</span>
                                <div
                                    className={`border-[3px] border-[var(--line)] px-4 py-3 shadow-[4px_4px_0_var(--shadow)] ${
                                        mine ? 'bg-[var(--yellow)] text-[var(--ink)] [--line:var(--ink)]' : 'bg-[var(--surface)]'
                                    }`}
                                >
                                    {text && <p className="break-words text-base font-medium leading-relaxed sm:text-lg">{text}</p>}
                                    {msg.fileUrl && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={msg.fileUrl} alt={msg.fileName || ''} className="mt-3 max-h-60 max-w-full border-[3px] border-[var(--ink)] object-contain" />
                                    )}
                                </div>
                                <span className="score text-[0.5rem] text-[var(--muted)]">{formatTime(msg.time)}</span>
                            </div>

                            {mine && (
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center border-[3px] border-[var(--line)] bg-[var(--surface-2)]" aria-hidden>
                                    <MdPerson className="text-2xl" />
                                </span>
                            )}
                        </div>
                    );
                })}

                {isTyping && (
                    <div className="flex items-start gap-3" role="status" aria-label={t('chat.typing')}>
                        <span className="block h-10 w-10 shrink-0 overflow-hidden border-[3px] border-[var(--line)] bg-[var(--pink)]" aria-hidden>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={LOGO} alt="" className="h-full w-full object-cover" />
                        </span>
                        <div className="flex gap-2 border-[3px] border-[var(--line)] bg-[var(--surface)] px-4 py-4 shadow-[4px_4px_0_var(--shadow)]" aria-hidden>
                            <span className="h-3 w-3 animate-bounce bg-[var(--pink)]" />
                            <span className="h-3 w-3 animate-bounce bg-[var(--yellow)] [animation-delay:-0.15s]" />
                            <span className="h-3 w-3 animate-bounce bg-[var(--cyan)] [animation-delay:-0.3s]" />
                        </div>
                    </div>
                )}
            </div>

            {/* Suggestions */}
            {showSuggestions && (
                <div className="mb-4">
                    <p className="mb-2 font-display text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{t('chat.suggestTitle')}</p>
                    <ul className="flex flex-wrap gap-3">
                        {suggestions.map((s) => (
                            <li key={s}>
                                <button type="button" onClick={() => submit(s, null)} className="btn btn--ghost !min-h-10 !px-4 !py-2 !text-sm !normal-case">
                                    {s}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Composer */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    submit(inputValue, pendingImage);
                }}
                className="relative border-[3px] border-[var(--line)] bg-[var(--surface)] p-2 shadow-[5px_5px_0_var(--shadow)]"
            >
                {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 z-50 mb-4">
                        <EmojiPicker onEmojiClick={(emoji) => setInputValue((prev) => prev + emoji.emoji)} skinTonesDisabled height={350} width={300} />
                    </div>
                )}

                {pendingImage && (
                    <div className="mb-2 flex items-center gap-3 border-[3px] border-[var(--line)] bg-[var(--surface-2)] p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pendingImage.url} alt="" className="h-14 w-14 border-2 border-[var(--line)] object-cover" />
                        <span className="min-w-0 flex-1 truncate font-display text-sm font-bold">{pendingImage.name}</span>
                        <button type="button" onClick={() => setPendingImage(null)} aria-label={t('chat.removeImage')} className="flex h-10 w-10 items-center justify-center border-[3px] border-[var(--line)] bg-[var(--pink)] text-[var(--ink)]">
                            <MdClose className="text-xl" />
                        </button>
                    </div>
                )}

                <div className="flex items-end gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isOffline || isUploading}
                        aria-label={t('chat.attach')}
                        title={t('chat.attach')}
                        className="flex h-11 w-11 shrink-0 items-center justify-center border-[3px] border-transparent text-[var(--muted)] transition-colors hover:border-[var(--line)] hover:bg-[var(--yellow)] hover:text-[var(--ink)] disabled:opacity-40"
                    >
                        <MdAttachFile className="text-2xl" />
                    </button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                    <label className="sr-only" htmlFor="chat-input">{t('chat.placeholder')}</label>
                    <textarea
                        id="chat-input"
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={() => setShowEmojiPicker(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                submit(inputValue, pendingImage);
                            }
                        }}
                        disabled={isOffline}
                        className="min-h-[2.75rem] flex-1 resize-none bg-transparent px-2 py-2.5 text-lg font-medium text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
                        placeholder={isOffline ? t('chat.finished') : t('chat.placeholder')}
                        rows={1}
                        maxLength={2000}
                    />

                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker((v) => !v)}
                        disabled={isOffline}
                        aria-label={t('chat.emoji')}
                        aria-pressed={showEmojiPicker}
                        title={t('chat.emoji')}
                        className={`flex h-11 w-11 shrink-0 items-center justify-center border-[3px] transition-colors disabled:opacity-40 ${showEmojiPicker ? 'border-[var(--line)] bg-[var(--yellow)] text-[var(--ink)]' : 'border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:bg-[var(--yellow)] hover:text-[var(--ink)]'}`}
                    >
                        <MdMood className="text-2xl" />
                    </button>
                    <button type="submit" disabled={isOffline || (!inputValue.trim() && !pendingImage)} aria-label={t('chat.send')} className="btn !min-h-11 !px-4 !py-2">
                        <MdSend className="text-2xl" />
                    </button>
                </div>
            </form>
            <p className="mt-3 text-center text-sm font-medium text-[var(--muted)]">{t('chat.aiNote')}</p>
        </div>
    );
};

export default ChatInterface;
