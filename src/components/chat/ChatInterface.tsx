import { useState, useEffect, useRef } from 'react';
import { FiSend, FiMoreVertical, FiPaperclip, FiSmile, FiMic, FiVideo, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { getBotResponse } from '../../utils/botLogic';
import EmojiPicker from 'emoji-picker-react';
import { useLanguage } from '../../context/LanguageContext';

const ChatInterface = () => {
    const { t } = useLanguage();
    const [messages, setMessages] = useState<any[]>([
        { id: 1, text: "¡Hola! Soy Pantcookie IA, la inteligencia artificial de la ShakeGang. 🍪🤖", sender: 'bot', time: new Date(), fileUrl: null, fileName: null }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [status, setStatus] = useState('online');
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [pendingImage, setPendingImage] = useState<{ url: string, base64: string, name: string } | null>(null);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [botIntensity, setBotIntensity] = useState(0.8);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Timers refs
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Initial constants
    const MAX_INACTIVITY_TIME = 3 * 60 * 1000; // 3 minutes

    // Auto-resize textarea logic
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [inputValue]);

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, showEmojiPicker]);

    // Setup timers on mount and reset interactions
    const resetTimers = () => {
        if (status === 'offline') return;

        // Clear existing
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

        // Set Max Inactivity Timer (3 mins)
        inactivityTimerRef.current = setTimeout(() => {
            handleTimeout();
        }, MAX_INACTIVITY_TIME);
    };

    useEffect(() => {
        resetTimers();
        return () => {
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        };
    }, [status]); // Re-run when status changes

    const handleTimeout = () => {
        setStatus('offline');
        addMessage(t('chat.resting'), 'bot');
    };

    const addMessage = (text: string | null, sender: 'user' | 'bot', fileUrl: string | null = null, fileName: string | null = null) => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            text,
            sender,
            fileUrl,
            fileName,
            time: new Date()
        }]);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputValue.trim() && !pendingImage) || status === 'offline') return;

        const userText = inputValue;
        const imageToSend = pendingImage;

        setInputValue('');
        setPendingImage(null);
        setShowEmojiPicker(false);

        // Add message to UI
        addMessage(userText || null, 'user', imageToSend?.url, imageToSend?.name);

        resetTimers(); // Reset timers on user action

        // Bot Response simulation
        setIsTyping(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userText,
                    imageUrl: imageToSend?.base64,
                    intensity: botIntensity // Enviar intensidad actual
                }),
            });
            if (!response.ok) {
                setIsTyping(false);
                addMessage("El servidor tuvo un problema. Intenta más tarde. 🍪", 'bot');
                return;
            }
            let data: any = null;
            try {
                const ct = response.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    data = await response.json();
                }
            } catch (_) { }
            setIsTyping(false);
            if (!data || typeof data.response !== 'string') {
                addMessage("No pude entender la respuesta del servidor. 🍪", 'bot');
                return;
            }

            // Actualizar intensidad si el bot lo solicita
            if (data.newIntensity !== undefined) {
                setBotIntensity(data.newIntensity);
                console.log("Nueva intensidad del bot:", data.newIntensity);
            }

            if (data.response === "EXIT") {
                addMessage(t('chat.exitMessage'), 'bot');
                if (isSoundEnabled) speakText(t('chat.exitMessage'));
                setStatus('offline');
                clearTimeout(inactivityTimerRef.current!);
            } else {
                const botReply = data.response || "Tengo un problemita procesando eso. 🍪";
                addMessage(botReply, 'bot');
                if (isSoundEnabled) speakText(botReply);
            }
        } catch (error) {
            console.error('Chat Error:', error);
            setIsTyping(false);
            addMessage("¡Ups! Parece que tengo un problema de conexión. 🔌🍪", 'bot');
        }
    };

    const onEmojiClick = (emojiObject: any) => {
        setInputValue(prev => prev + emojiObject.emoji);
    };

    const speakText = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();

        const cleanText = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();

        // Priorizar voces de alta calidad (Microsoft, Google)
        const preferredVoices = [
            'Microsoft Elena',
            'Microsoft Laura',
            'Google español',
            'Monica',
            'Paulina'
        ];

        let selectedVoice: SpeechSynthesisVoice | undefined | null = null;

        // Buscar coincidencia exacta o parcial con las preferidas
        for (const name of preferredVoices) {
            selectedVoice = voices.find(v => v.name.includes(name));
            if (selectedVoice) break;
        }

        // Fallback: Cualquier voz en español
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.toLowerCase().includes('es') || v.lang.toLowerCase().includes('spa'));
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            // Ajustar tono y velocidad según la voz para que suene menos robot
            if (selectedVoice.name.includes('Microsoft')) {
                utterance.rate = 1.05; // Ligeramente más rápido
                utterance.pitch = 1.0; // Tono natural
            } else {
                utterance.rate = 1.1;
                utterance.pitch = 1.1;
            }
        }

        window.speechSynthesis.speak(utterance);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || status === 'offline') return;

        // Validar tamaño (max 5MB para no saturar base64)
        if (file.size > 5 * 1024 * 1024) {
            addMessage("La imagen es muy pesada (máx 5MB). 🍪", 'bot');
            return;
        }

        setIsUploading(true);

        try {
            // Convertir a Base64 para enviar a la IA (Privacidad: No se sube a la nube)
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                const localPreviewUrl = URL.createObjectURL(file);

                setPendingImage({
                    url: localPreviewUrl,
                    base64: base64String,
                    name: file.name
                });

                setIsUploading(false);

                // Limpiar input
                if (fileInputRef.current) fileInputRef.current.value = '';
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error reading file:', error);
            setIsUploading(false);
            addMessage("No pude procesar la imagen. 🍪", 'bot');
        }
    };

    const formatTime = (date) => {
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    };

    const isOffline = status === 'offline';

    return (
        <div className="flex flex-col h-full w-full bg-transparent dark:bg-transparent overflow-hidden font-sans relative">
            {/* Header - Moved info to Sidebar, keeping it minimal or hidden as requested by UI design */}
            
            {/* Scrollable Messages Area */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide scroll-smooth relative z-10"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.sender === 'bot' && (
                            <div className="size-9 rounded-xl glass-panel border border-primary/40 flex items-center justify-center shrink-0 neon-glow-cyan">
                                <span className="material-symbols-outlined text-primary text-xl">bolt</span>
                            </div>
                        )}
                        
                        <div className={`flex flex-col gap-1.5 max-w-[80%] ${msg.sender === 'user' ? 'items-end' : ''}`}>
                            <span className="text-[10px] font-bold text-primary dark:text-primary uppercase tracking-widest px-1">
                                {msg.sender === 'bot' ? 'Pantcookie IA' : 'Core_Navigator'}
                            </span>
                            
                            <div className={`p-4 rounded-2xl shadow-lg leading-relaxed border ${
                                msg.sender === 'user'
                                    ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tr-none'
                                    : 'ai-bubble-gradient border-primary/10 text-slate-800 dark:text-slate-200 rounded-tl-none'
                            }`}>
                                {msg.text && <p className="break-words">{msg.text}</p>}
                                {msg.fileUrl && (
                                    <div className="mt-3">
                                        {(msg.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || msg.fileUrl.startsWith('blob:') || msg.fileUrl.startsWith('data:image')) ? (
                                            <img
                                                src={msg.fileUrl}
                                                alt="Uploaded content"
                                                className="max-w-full rounded-lg max-h-60 object-contain border border-black/10 dark:border-white/10"
                                            />
                                        ) : (
                                            <a
                                                href={msg.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 p-2 bg-black/5 dark:bg-white/5 rounded-lg hover:bg-black/10 transition-colors underline"
                                            >
                                                <FiPaperclip />
                                                <span className="truncate max-w-[150px]">{msg.fileName || 'Archivo'}</span>
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-600 px-1">
                                {formatTime(msg.time)}
                            </span>
                        </div>

                        {msg.sender === 'user' && (
                            <div className="size-9 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-900 border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-xl">person</span>
                            </div>
                        )}
                    </div>
                ))}

                {isTyping && (
                    <div className="flex items-start gap-4">
                        <div className="size-9 rounded-xl glass-panel border border-primary/40 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-xl">bolt</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <div className="ai-bubble-gradient border border-primary/10 px-4 py-3 rounded-2xl rounded-tl-none">
                                <div className="flex gap-1.5">
                                    <span className="size-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                                    <span className="size-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="size-1.5 bg-primary/80 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 relative z-20">
                <div className="max-w-5xl mx-auto w-full relative">
                    <div className="glass-panel rounded-2xl p-2 border border-slate-200 dark:border-slate-700/50 shadow-2xl focus-within:border-primary/50 transition-all">
                        {showEmojiPicker && (
                            <div className="absolute bottom-full left-0 mb-4 shadow-2xl rounded-xl z-50 animate-fade-in-up">
                                <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    theme={"auto" as any}
                                    searchDisabled={false}
                                    skinTonesDisabled
                                    height={350}
                                    width={300}
                                />
                            </div>
                        )}

                        <div className="flex items-end gap-2 px-2">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isOffline || isUploading}
                                className="size-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-primary hover:bg-primary/5 transition-all"
                            >
                                <span className="material-symbols-outlined">attach_file</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            
                            <textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onFocus={() => setShowEmojiPicker(false)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-200 py-3 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none font-medium" 
                                placeholder={isOffline ? t('chat.finished') : "Initialize query..."}
                                rows={1}
                            />

                            <div className="flex items-center gap-1 pb-1">
                                <button 
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    disabled={isOffline}
                                    className={`size-9 flex items-center justify-center rounded-lg transition-all ${showEmojiPicker ? 'text-accent-magenta bg-accent-magenta/5' : 'text-slate-500 hover:text-accent-magenta hover:bg-accent-magenta/5'}`}
                                >
                                    <span className="material-symbols-outlined">mood</span>
                                </button>
                                <button className="size-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-primary hover:bg-primary/5 transition-all">
                                    <span className="material-symbols-outlined">mic</span>
                                </button>
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={isOffline || (!inputValue.trim() && !pendingImage)}
                                    className="size-10 flex items-center justify-center rounded-xl bg-primary text-background-dark neon-glow-cyan hover:scale-105 transition-transform ml-2 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    <span className="material-symbols-outlined font-bold">send</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center mt-3">
                        <p className="text-[9px] text-slate-500 dark:text-slate-600 font-bold uppercase tracking-[0.3em]">Hardware Accelerated Interface • Ver 2.4.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
