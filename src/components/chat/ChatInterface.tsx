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
    const [botIntensity, setBotIntensity] = useState(0.8); // 0.2 (Serio) - 1.0 (Caótico)
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Timers refs
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Initial constants
    const MAX_INACTIVITY_TIME = 3 * 60 * 1000; // 3 minutes
    const MAX_WORDS = 2000;

    const countWords = (str: string) => {
        return str.trim() === '' ? 0 : str.trim().split(/\s+/).length;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if (countWords(newValue) <= MAX_WORDS) {
            setInputValue(newValue);
        }
    };

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
        setInputValue(prev => {
            const newValue = prev + emojiObject.emoji;
            if (countWords(newValue) <= MAX_WORDS) {
                return newValue;
            }
            return prev;
        });
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
        <div className="flex flex-col h-[800px] w-full max-w-2xl mx-auto bg-[#e5ddd5] dark:bg-[#0b0509] rounded-xl shadow-2xl overflow-hidden border border-black/20 dark:border-white/10 font-sans relative">
            {/* Header */}
            <div className="bg-primary-pink/90 dark:bg-[#2a1b25]/80 backdrop-blur-md p-3 text-white flex items-center justify-between shadow-sm z-20 relative border-b border-black/10 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img
                            src="./Fotos/Shura HiwaLogo 6.png"
                            alt="Bot Avatar"
                            className="w-10 h-10 rounded-full bg-white object-contain p-1"
                        />
                        {status === 'online' && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-pokemon-green rounded-full border-2 border-primary-pink dark:border-[#202c33]"></div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-base leading-tight">Pantcookie IA</h3>
                        <p className="text-xs text-white/80">
                            {status === 'online' ? t('chat.online') : t('chat.offline')}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 text-white/80">
                    <button
                        onClick={() => {
                            if (isSoundEnabled) window.speechSynthesis.cancel();
                            setIsSoundEnabled(!isSoundEnabled);
                        }}
                        className="hover:text-white transition-colors"
                        title={isSoundEnabled ? "Desactivar voz" : "Activar voz"}
                    >
                        {isSoundEnabled ? <FiVolume2 className="w-5 h-5" /> : <FiVolumeX className="w-5 h-5 opacity-70" />}
                    </button>
                    <button><FiVideo className="w-5 h-5 pointer-events-none opacity-50" /></button>
                    <button><FiMoreVertical className="w-5 h-5 cursor-pointer hover:text-white" /></button>
                </div>
            </div>

            {/* Content Wrapper - Handles Background and Scrolling independently */}
            <div className="flex-1 relative overflow-hidden group">
                {/* Fixed Background Layer */}
                <div
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                        backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                        backgroundRepeat: 'repeat',
                        backgroundSize: '400px',
                        opacity: 0.4,
                        mixBlendMode: 'overlay'
                    }}
                ></div>

                {/* Gradient Background Layer */}
                <div className="absolute inset-0 bg-[#e5ddd5] dark:bg-radial-dark z-[-1]"></div>
                <div className="absolute inset-0 bg-white/40 dark:bg-transparent backdrop-blur-[2px] z-[-1]"></div>

                {/* Scrollable Messages Area */}
                <div
                    ref={scrollContainerRef}
                    className="absolute inset-0 overflow-y-auto p-4 space-y-2 z-10 scrollbar-hide scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style jsx>{`
                        div::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
                    {/* Security Message Mock */}
                    <div className="flex justify-center mb-4">
                        <div className="bg-[#fff5c4] dark:bg-[#182229]/80 backdrop-blur-sm text-gray-800 dark:text-[#ffde00] text-[10px] px-3 py-1.5 rounded-lg shadow-md border border-yellow-500/20 text-center max-w-[80%] font-medium">
                            {t('chat.security')}
                        </div>
                    </div>

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-md text-sm relative group border-2 ${msg.sender === 'user'
                                    ? 'bg-primary-blue text-white rounded-tr-none border-primary-blue-dark'
                                    : 'bg-[var(--poke-card)] text-[var(--poke-text)] rounded-tl-none border-black/10 dark:border-white/10'
                                    }`}
                            >
                                {msg.text && <p className="mb-3 break-words leading-relaxed">{msg.text}</p>}
                                {msg.fileUrl && (
                                    <div className="mb-3">
                                        {(msg.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || msg.fileUrl.startsWith('blob:') || msg.fileUrl.startsWith('data:image')) ? (
                                            <img
                                                src={msg.fileUrl}
                                                alt="Uploaded content"
                                                className="max-w-full rounded-lg mb-2 max-h-60 object-contain border border-black/10 dark:border-white/10"
                                            />
                                        ) : (
                                            <a
                                                href={msg.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 p-2 bg-black/10 dark:bg-white/10 rounded-lg hover:bg-black/20 transition-colors underline"
                                            >
                                                <FiPaperclip />
                                                <span className="truncate max-w-[150px]">{msg.fileName || 'Archivo'}</span>
                                            </a>
                                        )}
                                    </div>
                                )}
                                <span suppressHydrationWarning className={`absolute bottom-1 right-2 text-[10px] ${msg.sender === 'user' ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {formatTime(msg.time)}
                                    {msg.sender === 'user' && <span className="ml-1 text-pokemon-yellow">✓✓</span>}
                                </span>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-[#202c33] rounded-lg rounded-tl-none px-4 py-3 shadow-sm flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white/80 dark:bg-[#202c33]/90 backdrop-blur-md p-3 flex items-center gap-2 z-20 relative border-t border-black/10 dark:border-white/5">
                {/* Emoji Popover */}
                {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 shadow-2xl rounded-xl z-50 animate-fade-in-up">
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

                <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    disabled={isOffline}
                    className={`p-2 rounded-full transition disabled:opacity-50 ${showEmojiPicker ? 'text-primary-pink bg-black/5 dark:bg-white/5' : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                    <FiSmile className="w-6 h-6" />
                </button>
                <button
                    disabled={isOffline || isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition disabled:opacity-50"
                >
                    <FiPaperclip className={`w-5 h-5 ${isUploading ? 'animate-pulse text-primary-pink' : ''}`} />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />

                <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
                    <div className="flex-1 relative">
                        {pendingImage && (
                            <div className="absolute bottom-full left-0 mb-2 p-2 bg-white/90 dark:bg-[#202c33]/90 backdrop-blur-sm rounded-xl shadow-lg border border-black/10 dark:border-white/10 flex items-center gap-3 animate-fade-in-up z-10">
                                <img
                                    src={pendingImage.url}
                                    alt="Preview"
                                    className="h-16 w-16 object-cover rounded-lg border border-black/5 dark:border-white/5"
                                />
                                <div className="flex flex-col gap-1 pr-2">
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate max-w-[120px]">
                                        {pendingImage.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPendingImage(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        className="text-[10px] text-red-500 hover:text-red-600 font-semibold uppercase tracking-wider text-left hover:underline"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        )}
                        <textarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={handleInputChange}
                            onFocus={() => setShowEmojiPicker(false)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            placeholder={isOffline ? t('chat.finished') : t('chat.placeholder')}
                            disabled={isOffline}
                            rows={1}
                            className="w-full py-2.5 px-4 bg-gray-100 dark:bg-black/20 rounded-xl text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-pink/50 disabled:opacity-50 disabled:cursor-not-allowed border border-black/5 dark:border-white/5 resize-none scrollbar-none min-h-[44px]"
                        />
                    </div>
                </form>

                {inputValue.trim() || pendingImage ? (
                    <button
                        onClick={handleSendMessage}
                        disabled={isOffline}
                        className="p-3 bg-primary-pink text-white rounded-full hover:bg-primary-pink-light transition shadow-lg flex items-center justify-center disabled:bg-gray-400 active:scale-95"
                    >
                        <FiSend className="w-5 h-5 translate-x-0.5" />
                    </button>
                ) : (
                    <button disabled={isOffline} className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50">
                        <FiMic className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatInterface;
