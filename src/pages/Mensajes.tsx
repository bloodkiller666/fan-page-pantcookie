'use client';
import React, { useState, useRef, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { FaUser, FaImage, FaPaperPlane, FaTrash, FaGlobeAmericas, FaSmile, FaCheckCircle, FaTimesCircle, FaAward } from 'react-icons/fa';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { addWallMessage, subscribeToWallMessages } from '../utils/firebase';
import { useLanguage } from '../context/LanguageContext';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/dist/Draggable';
import { splitText } from '../utils/animations';

if (typeof window !== "undefined") {
    gsap.registerPlugin(Draggable);
}

// Simple list of countries (can be fetched from API in future)
const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador",
  "El Salvador", "España", "Estados Unidos", "Guatemala", "Honduras", "México", "Nicaragua",
  "Panamá", "Paraguay", "Perú", "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela", "Otro"
];

const MAX_WORDS = 2000;

const countWords = (str: string) => {
  return str.trim() === '' ? 0 : str.trim().split(/\s+/).length;
};

interface Message {
  id: number;
  username: string;
  country: string;
  text: string;
  image: string | null;
  timestamp: string;
  color: { color: string; hover: string; };
}

const MensajesContent = () => {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'write' | 'read' | 'view'>('write');
  const [messages, setMessages] = useState<Message[]>([]);
  const [countryFlash, setCountryFlash] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [messageText, setMessageText] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false); // Track if form has unsaved changes

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<'idle' | 'analyzing' | 'completed'>('idle');
  const [analysisResults, setAnalysisResults] = useState({
    text: 'loading' as 'loading' | 'pass' | 'fail',
    media: 'pass' as 'loading' | 'pass' | 'fail'
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState({ show: false, status: 'approved' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const cardsWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to Wall Messages
  useEffect(() => {
    console.log("Subscribing to wall messages...");
    const unsubscribe = subscribeToWallMessages((newMessages) => {
      console.log("Received new messages from Firebase:", newMessages);
      if (newMessages.length === 0) {
        console.log("No messages found in 'wall_messages' collection.");
      }
      setMessages(newMessages.map(msg => ({
        id: msg.id,
        username: msg.username,
        country: msg.country,
        text: msg.text,
        image: msg.imageUrl,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toLocaleString() : new Date(msg.timestamp).toLocaleString(),
        color: getRandomColor() // Note: Color is local-only for now, could be saved if needed
      })));
    });
    return () => unsubscribe();
  }, []);

  // Deep Linking: Update activeTab based on URL query param
  useEffect(() => {
    const view = searchParams?.get('view');
    if (view === 'read' || view === 'write') {
      setActiveTab(view as 'write' | 'read'); // Cast as string check is loose
    }
  }, [searchParams]);

  // Unsaved Changes Warning (Browser Refresh/Close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Standard for modern browsers
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Detect form changes
  useEffect(() => {
    if (username || country || messageText || selectedImage) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [username, country, messageText, selectedImage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageText((prev) => prev + emojiData.emoji);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setErrors({ ...errors, image: '' });

      // Simulate file analysis
      setTimeout(() => {
        if (file.size > 20 * 1024 * 1024) { // 20MB
          setErrors((prev) => ({ ...prev, image: t('wall.imageSizeError') || 'Imagen demasiado grande (Máx 20MB)' }));
          setSelectedImage(null);
          setImagePreview(null);
        } else {
          setSelectedImage(file);
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
        setIsLoading(false);
      }, 1000);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    // Reset file input value is tricky in React without ref, usually fine to just clear state
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = t('wall.usernameError');
    if (!country.trim()) newErrors.country = t('wall.countryError');
    if (!messageText.trim()) newErrors.message = t('wall.messageError');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        return data.url;
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (honeypot) {
       // Silent rejection for bots
       setIsLoading(false);
       return;
    }
    setIsLoading(true);
    setAnalysisPhase('analyzing');
    setAnalysisResults({ text: 'loading', media: selectedImage ? 'pass' : 'pass' });

    try {
      let imageUrl: string | null = null;
      
      // Step 0: Media Check (Immediate since it's local)
      if (selectedImage && selectedImage.size > 20 * 1024 * 1024) {
        setAnalysisResults(prev => ({ ...prev, media: 'fail' }));
        // We'll let it proceed but it will likely fail or show error later
      }

      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          setErrors({ ...errors, image: t('wall.imageUploadError') });
          setIsLoading(false);
          setAnalysisPhase('idle');
          return;
        }
      }

      // 1. AI moderation check
      const moderationResponse = await fetch('/api/admin/moderate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText }),
      });
      
      const moderationResult = await moderationResponse.json();
      const status = moderationResult.status === 'banned' ? 'banned' : 'approved';
      
      // Update Analysis Display
      setAnalysisResults(prev => ({ 
        ...prev, 
        text: status === 'approved' ? 'pass' : 'fail' 
      }));

      // Small delay to let user see the checkmarks
      await new Promise(r => setTimeout(r, 1500));

      // 2. Save to Firebase with resulting status
      await addWallMessage(username, country, messageText, imageUrl, status);

      setIsDirty(false);
      setAnalysisPhase('completed');
      setShowSuccessModal({ show: true, status });
    } catch (error) {
      console.error("Error sending message:", error);
      setErrors({ ...errors, form: t('wall.submitError') });
      setAnalysisPhase('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSuccessModal = (viewMessages = false) => {
    setShowSuccessModal({ show: false, status: 'approved' });
    setAnalysisPhase('idle');
    setUsername('');
    setCountry('');
    setMessageText('');
    setSelectedImage(null);
    setImagePreview(null);
    setErrors({});
    if (viewMessages) {
      setActiveTab('read');
      router.push('/mensajes?view=read'); // Update URL
    }
  };

  const handleDelete = (id: number) => {
    setMessages(messages.filter(msg => msg.id !== id));
  };

  const handleTabChange = (tab: 'write' | 'read') => {
    setActiveTab(tab);
    router.push(`/mensajes?view=${tab}`);
  }

  // GSAP: Title Badge Reveal
  useEffect(() => {
    const titleElement = document.querySelector('.muro-title');
    if (!titleElement) return;
    const chars = splitText(titleElement as HTMLElement);
    chars.forEach(c => c.classList.add('muro-title-char'));
    gsap.from(chars, {
      duration: 0.8,
      opacity: 0,
      y: -50,
      rotateX: -90,
      filter: 'blur(10px)',
      stagger: 0.05,
      ease: 'back.out(2)',
      delay: 0.8,
    });
  }, []);

  // GSAP Animations for Tabs
  useEffect(() => {
    if (isLoading) return;
    let ctx: gsap.Context | null = null;

    if (activeTab === 'write') {
      ctx = gsap.context(() => {
        gsap.from('.write-container', { scale: 0.8, opacity: 0, duration: 0.6, ease: 'back.out(1.7)' });
        gsap.to('.cursor-pokemon', { opacity: 0, repeat: -1, duration: 0.5, yoyo: true });
      }, containerRef);
    }

    if (activeTab === 'read' && messages.length > 0) {
      ctx = gsap.context(() => {
        const wrapper = cardsWrapperRef.current;
        if (!wrapper) return;

        // Entry animation
        gsap.from('.message-card', {
          x: 200,
          opacity: 0,
          stagger: 0.05,
          duration: 1,
          ease: 'power3.out',
        });

        // Calculate drag bounds
        const minX = -(wrapper.scrollWidth - (wrapper.parentElement?.clientWidth || window.innerWidth));

        // GSAP Draggable
        Draggable.create(wrapper, {
          type: 'x',
          edgeResistance: 0.65,
          bounds: { minX, maxX: 0 },
          inertia: true,
          cursor: 'grab',
          activeCursor: 'grabbing',
          onDragStart() {
            gsap.to('.message-card', { scale: 0.97, duration: 0.3 });
          },
          onDragEnd() {
            gsap.to('.message-card', { scale: 1, duration: 0.3 });
          },
        });

        // Mouse wheel horizontal scroll
        const handleWheel = (e: WheelEvent) => {
          e.preventDefault();
          const delta = e.deltaY || e.deltaX;
          const currentX = gsap.getProperty(wrapper, 'x') as number;
          const targetX = Math.max(minX, Math.min(0, currentX - delta * 1.5));
          gsap.to(wrapper, { x: targetX, duration: 0.5, ease: 'power2.out', overwrite: true });
        };

        wrapper.parentElement?.addEventListener('wheel', handleWheel, { passive: false });

        // Return cleanup inside context via a custom mechanism
        (wrapper as any).__cleanupWheel = () =>
          wrapper.parentElement?.removeEventListener('wheel', handleWheel);
      }, cardsWrapperRef);
    }

    return () => {
      const wrapper = cardsWrapperRef.current;
      if (wrapper && (wrapper as any).__cleanupWheel) {
        (wrapper as any).__cleanupWheel();
      }
      ctx?.revert();
    };
  }, [activeTab, messages, isLoading]);

  const getRandomColor = () => {
    const types = [
      { color: 'bg-red-500/20 border-red-500/30', hover: 'hover-fire' },
      { color: 'bg-blue-500/20 border-blue-500/30', hover: 'hover-water' },
      { color: 'bg-green-500/20 border-green-500/30', hover: 'hover-grass' },
      { color: 'bg-yellow-500/20 border-yellow-500/30', hover: 'hover-electric' },
    ];
    return types[Math.floor(Math.random() * types.length)];
  };


  return (
    <div ref={containerRef} className="min-h-screen pt-20 pb-10 relative overflow-hidden">

      {/* Fondo de Pokébolas Adaptable */}
      <div
        className="absolute inset-0 z-0 opacity-[0.04] dark:opacity-[0.25]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg fill='currentColor' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M450.46,256.09C449.35,175.17,399.81,102.71,324,73.79,247.59,44.67,157.49,69,105.82,132.13,54.4,195,46.61,285.58,88.49,355.68c41.8,69.95,123.74,106,203.55,91.63,91-16.37,156.14-98.12,158.35-189.14A20.16,20.16,0,0,0,450.46,256.09ZM119.05,174.38C152.76,118,220.23,87,285,99.43c69.4,13.29,120.43,70.47,128.83,139H318.41c-8.26-27.36-32-48-62.62-48-29.65,0-55.15,20.65-63.11,48H97.74A158,158,0,0,1,119.05,174.38ZM286.13,256.1c-2,38.75-60.67,39.4-60.67,0S284.17,217.33,286.13,256.1Zm24,149.79C246.85,428.58,175,408.74,132.3,356.82a157.53,157.53,0,0,1-34.57-83H192.6c7.91,27.39,33.7,48,63.19,48,30.67,0,54.36-20.68,62.62-48h95.45C406.61,333,367.54,385.32,310.14,405.89Z'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px',
          backgroundRepeat: 'repeat',
          color: 'gray' // Esto define el 'currentColor' del fill del SVG
        }}
      />

      <div className="container mx-auto px-4 relative z-10">

        {/* Header & Tabs */}
        <div className="text-center mb-10">
          <h1 className="muro-title text-4xl md:text-6xl font-black uppercase tracking-tighter italic neon-text-pink mb-8 inline-block">
            {t('wall.title')}
          </h1>

          <div className="flex justify-center gap-6 mb-10">
            <button
              onClick={() => handleTabChange('write')}
              className={`${activeTab === 'write' ? 'poke-button-pink' : 'poke-button bg-white dark:bg-gray-800 text-gray-400 border-gray-300'}`}
            >
              <FaPaperPlane className="inline mr-2" /> {t('wall.write')}
            </button>
            <button
              onClick={() => handleTabChange('read')}
              className={`${activeTab === 'read' ? 'poke-button-blue' : 'poke-button bg-white dark:bg-gray-800 text-gray-400 border-gray-300'}`}
            >
              <FaImage className="inline mr-2" /> {t('wall.read')}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto">

          {/* WRITE MODE — GBA Console (Pink) */}
          {activeTab === 'write' && (
            <div className="write-container w-full flex justify-center">
              <main className="relative w-full max-w-3xl gba-console-pink p-6 md:p-10">
                {/* Console top decor */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-3">
                  <div className="w-20 h-1 bg-black/20 rounded-full" />
                  <div className="w-10 h-1 bg-black/20 rounded-full" />
                </div>

                {/* GBA Screen */}
                <div className="scanlines relative bg-black rounded-xl p-3 md:p-6 border-[8px] border-[#222] mt-6">
                  <div className="crt-flicker bg-white rounded-sm flex flex-col p-4 md:p-6 overflow-hidden min-h-[400px]">

                    {/* Analysis Screen Overlay */}
                    {analysisPhase !== 'idle' ? (
                      <div className="flex flex-col h-full animate-in fade-in zoom-in duration-300">
                         <header className="flex justify-between items-center border-b-4 border-black pb-4 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-primary rounded-full animate-pulse border-2 border-black" />
                                <h2 className="font-pixel text-[10px] text-black uppercase tracking-widest">Neural Analysis</h2>
                            </div>
                         </header>

                         <div className="space-y-8 flex-grow">
                            <h3 className="font-pixel text-[12px] text-black mb-4 uppercase leading-relaxed">
                                Se está analizando lo siguiente:
                            </h3>

                            <div className="space-y-6">
                                {/* Message Analysis Row */}
                                <div className="flex items-center justify-between bg-gray-100 p-4 border-2 border-black pixel-shadow">
                                   <span className="font-pixel text-[9px] text-black">Contenido del mensaje</span>
                                   {analysisResults.text === 'loading' ? (
                                     <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                   ) : analysisResults.text === 'pass' ? (
                                     <FaCheckCircle className="text-green-600 text-xl animate-bounce-in" />
                                   ) : (
                                     <div className="flex items-center gap-2">
                                        <span className="font-pixel text-[8px] text-rose-500 uppercase">Review Required</span>
                                        <div className="w-6 h-6 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center animate-bounce-in">
                                            <span className="font-pixel text-black text-[12px]">!</span>
                                        </div>
                                     </div>
                                   )}
                                </div>

                                {/* Media Analysis Row */}
                                <div className="flex items-center justify-between bg-gray-100 p-4 border-2 border-black pixel-shadow">
                                   <span className="font-pixel text-[9px] text-black">Contenido multimedia</span>
                                   {selectedImage ? (
                                       analysisResults.media === 'pass' ? (
                                        <FaCheckCircle className="text-green-600 text-xl animate-bounce-in" />
                                       ) : (
                                        <FaTimesCircle className="text-rose-600 text-xl animate-bounce-in" />
                                       )
                                   ) : (
                                     <span className="font-pixel text-[8px] text-gray-400">N/A</span>
                                   )}
                                </div>
                            </div>

                            <div className="mt-auto pt-6">
                                <div className="w-full bg-gray-200 h-2 border-2 border-black">
                                    <div 
                                        className="bg-primary h-full transition-all duration-1000" 
                                        style={{ width: analysisResults.text === 'loading' ? '40%' : '100%' }}
                                    />
                                </div>
                                <p className="font-pixel text-[7px] text-gray-500 mt-2 animate-pulse uppercase">
                                    {analysisResults.text === 'loading' ? 'Encrypting data stream...' : 'Transmission complete'}
                                </p>
                            </div>
                         </div>
                      </div>
                    ) : (
                      <>
                        {/* Original Form Content */}
                        <header className="flex justify-between items-center border-b-4 border-black pb-4 mb-6">
                      <div className="flex items-center gap-3">
                        {/* Mini Pokéball */}
                        <div className="relative w-7 h-7 bg-[#cc0000] rounded-full border-4 border-black flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full border-2 border-black" />
                        </div>
                        <h2 className="font-pixel text-[10px] md:text-xs tracking-tighter text-black uppercase">Email</h2>
                      </div>
                      <span className="font-pixel text-[8px] text-gray-400">ID: 08522</span>
                    </header>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                      {/* Honeypot Field (Hidden from layout but visible to bots) */}
                      <input 
                         type="text" 
                         name="websiteUrl" 
                         value={honeypot}
                         onChange={(e) => setHoneypot(e.target.value)}
                         tabIndex={-1} 
                         autoComplete="off" 
                         style={{ position: 'absolute', left: '-9999px', opacity: 0 }} 
                      />

                      {/* Trainer Name */}
                      <div>
                        <label className="block font-pixel text-[9px] mb-2 text-[#3b4cca] uppercase">Nombre:</label>
                        <div className="relative group transition-transform focus-within:scale-[1.01]">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-sm font-pixel">▶</span>
                          <input
                            type="text"
                            value={username}
                            maxLength={15}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 bg-transparent border-b-4 border-dashed ${errors.username ? 'border-[#cc0000]' : 'border-gray-300'} focus:border-[#cc0000] focus:ring-0 text-black font-pixel text-[10px] uppercase placeholder:text-gray-300 transition-colors outline-none`}
                            placeholder="Ingresa tu nombre"
                          />
                        </div>
                        {errors.username && <p className="font-pixel text-[8px] text-[#cc0000] mt-1 uppercase">{errors.username}</p>}
                      </div>

                      {/* Region / Country */}
                      <div>
                        <label className="block font-pixel text-[9px] mb-2 text-[#3b4cca] uppercase">Region / Country:</label>
                        <div className={`relative transition-all focus-within:scale-[1.01] ${countryFlash ? 'country-flash' : ''}`}>
                          <select
                            value={country}
                            onChange={(e) => {
                              setCountry(e.target.value);
                              setCountryFlash(true);
                              setTimeout(() => setCountryFlash(false), 300);
                            }}
                            className={`w-full pl-4 pr-10 py-3 bg-gray-100 border-4 ${errors.country ? 'border-[#cc0000]' : 'border-black'} text-black font-pixel text-[9px] appearance-none cursor-pointer focus:bg-yellow-50 transition-all outline-none`}
                          >
                            <option value="">{t('wall.countryPlaceholder')}</option>
                            {COUNTRIES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black" />
                          </div>
                        </div>
                        {errors.country && <p className="font-pixel text-[8px] text-[#cc0000] mt-1 uppercase">{errors.country}</p>}
                      </div>

                      {/* Message (Dialogue Box) */}
                      <div className="flex-grow flex flex-col">
                        <label className="block font-pixel text-[9px] mb-2 text-[#3b4cca] uppercase">Escribe tu mensaje:</label>
                        <div className="relative poke-dialogue-border bg-white p-4 flex-grow">
                          <textarea
                            value={messageText}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              if (countWords(newValue) <= MAX_WORDS) setMessageText(newValue);
                            }}
                            maxLength={2000}
                            className={`w-full h-32 bg-transparent border-none focus:ring-0 text-black font-pixel text-[9px] leading-relaxed resize-none p-0 placeholder:text-gray-300 outline-none`}
                            placeholder="Escribe algo..."
                          />
                          <div className="absolute bottom-2 right-4 dialogue-arrow" />
                          {/* Emoji */}
                          <button
                            type="button"
                            aria-label="Insertar emoji"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="absolute top-2 right-4 text-gray-400 hover:text-[#cc0000] transition-colors z-20"
                          >
                            <FaSmile size={18} />
                          </button>
                          {showEmojiPicker && (
                            <div className="absolute right-0 bottom-full mb-2 z-50" ref={emojiPickerRef}>
                              <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.DARK} width={300} height={400} />
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end mt-1">
                          <span className="font-pixel text-[8px] text-gray-400">{MAX_WORDS - countWords(messageText)} {t('wall.wordsLeft')}</span>
                        </div>
                        {errors.message && <p className="font-pixel text-[8px] text-[#cc0000] mt-1 uppercase">{errors.message}</p>}
                      </div>

                      {/* Attached Snapshot */}
                      <div>
                        <label className="block font-pixel text-[9px] mb-2 text-[#3b4cca] uppercase">Adjunta un archivo</label>
                        {!imagePreview ? (
                          <div className="relative border-4 border-black border-dotted p-4 bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              disabled={isLoading}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {isLoading ? (
                              <div className="flex flex-col items-center gap-2 text-gray-400">
                                <div className="w-6 h-6 border-2 border-[#cc0000] border-t-transparent rounded-full animate-spin" />
                                <span className="font-pixel text-[8px]">{t('wall.imageAnalyzing')}</span>
                              </div>
                            ) : (
                              <div className="text-center">
                                <p className="font-pixel text-[8px] text-gray-400">{selectedImage ? selectedImage.name : 'SELECCIONA UNA IMAGEN'}</p>
                                <p className="font-pixel text-[8px] text-gray-400 mt-1">(MAX 10MB)</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative mt-2 w-full h-40 rounded overflow-hidden border-4 border-black group">
                            <Image src={imagePreview} alt={t('wall.altUpload')} fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button type="button" onClick={removeImage} className="bg-[#cc0000] text-white rounded-full p-3 pixel-shadow btn-gb-press">
                                <FaTrash size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                        {errors.image && <p className="font-pixel text-[8px] text-[#cc0000] mt-1 uppercase">{errors.image}</p>}
                      </div>

                      {/* Console Buttons */}
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
                        <div className="flex items-center gap-6">
                          {/* B — Reset */}
                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => { setUsername(''); setCountry(''); setMessageText(''); setSelectedImage(null); setImagePreview(null); setErrors({}); }}
                              className="w-16 h-16 bg-gray-300 rounded-full border-4 border-black flex items-center justify-center btn-gb-press pixel-shadow mb-1"
                            >
                              <span className="font-pixel text-black text-ls">B</span>
                            </button>
                            <p className="font-pixel text-[7px] text-black">RESET</p>
                          </div>
                          {/* A — Submit */}
                          <div className="text-center">
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="w-16 h-16 bg-[#cc0000] rounded-full border-4 border-black flex items-center justify-center btn-gb-press pixel-shadow mb-1 disabled:opacity-50"
                            >
                              <span className="font-pixel text-white text-lg">{isLoading ? '...' : 'A'}</span>
                            </button>
                            <p className="font-pixel text-[7px] text-black">SEND DATA</p>
                          </div>
                        </div>
                        <p className="font-pixel text-[7px] text-gray-400 text-right leading-loose">
                          Ensure all data is<br />correct before transmitting.
                        </p>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>

                {/* GBA Select / Start */}
                <div className="flex justify-center mt-6 gap-8">
                  <div className="-rotate-[15deg] text-center">
                    <div className="w-10 h-3 bg-black/30 rounded-full border border-black/20" />
                    <p className="font-pixel text-[6px] text-black/40 mt-1">SELECT</p>
                  </div>
                  <div className="-rotate-[15deg] text-center">
                    <div className="w-10 h-3 bg-black/30 rounded-full border border-black/20" />
                    <p className="font-pixel text-[6px] text-black/40 mt-1">START</p>
                  </div>
                </div>

                {/* Speaker Grille */}
                <div className="absolute bottom-8 right-8 grid grid-cols-3 gap-1.5 opacity-20">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 bg-black rounded-full" />
                  ))}
                </div>
              </main>
            </div>
          )}

          {/* READ MODE — Draggable Horizontal Carousel */}
          {activeTab === 'read' && (
            <div className="relative w-full h-[85vh] flex items-center overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing mb-15">
              {messages.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center text-gray-400 w-full">
                  <FaImage size={64} className="mb-4 opacity-50" />
                  <p className="text-2xl italic">{t('wall.emptyWall')}</p>
                  <p className="mt-2">{t('wall.emptySub')}</p>
                  <button onClick={() => handleTabChange('write')} className="mt-6 text-pink-400 hover:text-pink-300 font-bold underline">
                    {t('wall.emptyGoWrite')}
                  </button>
                </div>
              ) : (
                <>
                  {/* BG Title */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <h2 className="text-[15vw] font-black text-black/[0.04] dark:text-white/[0.03] uppercase italic select-none leading-none tracking-tighter">
                      POKÉWALL
                    </h2>
                  </div>

                  {/* Counter bar */}
                  <div className="absolute top-0 left-0 right-0 z-20 bg-[var(--poke-pink)]/10 border-b border-[var(--poke-pink)]/20 py-3 text-center">
                    <p className="font-pixel text-[14px] text-[var(--poke-white)] tracking-[0.4em] animate-pulse">
                      REGISTROS DE ENTRENADORES: {messages.length}
                    </p>
                  </div>

                  {/* Draggable wrapper */}
                  <div
                    ref={cardsWrapperRef}
                    className="flex flex-nowrap gap-8 px-[8vw] items-center will-change-transform relative z-10 pt-24"
                  >
                    {messages.map((msg, index) => (
                      <div
                        key={msg.id}
                        className={`message-card flex-shrink-0 w-[320px] md:w-[400px] h-[460px] bg-white dark:bg-zinc-900 border-t-8 border-[var(--poke-pink)] rounded-[2rem] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative hover:-translate-y-3 transition-transform duration-300 ${msg.color.hover}`}
                      >
                        <div className="flex justify-between items-start mb-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--poke-pink)]/10 dark:bg-white/10 flex items-center justify-center border border-[var(--poke-pink)]/20">
                              <FaUser className="text-[var(--poke-pink)]" />
                            </div>
                            <div>
                              <h4 className="text-gray-900 dark:text-white font-bold text-base leading-none mb-1">{msg.username}</h4>
                              <div className="flex items-center gap-1">
                                <span className="font-pixel text-[8px] text-gray-400 uppercase">{msg.country}</span>
                                <FaAward className="text-yellow-500 text-xs ml-1" />
                              </div>
                            </div>
                          </div>
                          <button onClick={() => handleDelete(msg.id)} aria-label={t('wall.deleteMessage')} className="text-gray-300 dark:text-white/20 hover:text-red-500 transition-colors">
                            <FaTrash size={13} />
                          </button>
                        </div>

                        <div className="bg-gray-50 dark:bg-black/40 p-4 rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col justify-start h-[calc(100%-170px)] overflow-hidden">
                          {msg.image && (
                            <div className="mb-3 rounded-xl overflow-hidden border border-gray-200 dark:border-black/50 aspect-video relative flex-shrink-0">
                              <Image src={msg.image} alt="User upload" fill className="object-cover" sizes="400px" />
                            </div>
                          )}
                          <p className="text-gray-700 dark:text-gray-300 text-sm italic font-medium leading-relaxed line-clamp-5">&ldquo;{msg.text}&rdquo;</p>
                        </div>

                        <div className="absolute bottom-5 left-7 right-7 flex justify-between items-center font-pixel text-[8px] text-gray-400 border-t border-gray-100 dark:border-white/5 pt-3">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--poke-pink)] animate-ping" />
                            #{index + 1}
                          </span>
                          <span>{msg.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Drag hint */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 opacity-50">
                    <span className="font-pixel text-[8px] text-gray-500 animate-pulse">← DRAG →</span>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 rounded-3xl p-8 max-w-sm w-full border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.3)] text-center transform scale-100 animate-bounce-in">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              {showSuccessModal.status === 'approved' ? (
                <FaCheckCircle className="text-green-500 text-5xl" />
              ) : (
                <div className="w-16 h-16 bg-yellow-400 border-4 border-black rounded-full flex items-center justify-center">
                    <span className="font-pixel text-black text-4xl">!</span>
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
                {showSuccessModal.status === 'approved' ? t('wall.published') || '¡Publicado!' : 'En Revisión'}
            </h3>
            <p className="text-gray-300 mb-8">
                {showSuccessModal.status === 'approved' 
                    ? t('wall.publishedSub') || 'Gracias por tu mensaje, ya está en el muro.' 
                    : 'Tu mensaje ha sido recibido y está siendo revisado por moderación.'}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleCloseSuccessModal(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
              >
                {t('Ver mensajes')}
              </button>
              <button
                onClick={() => handleCloseSuccessModal(false)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {t('Escribe otro mensaje')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Mensajes() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-pattern flex items-center justify-center text-white">Loading...</div>}>
      <MensajesContent />
    </Suspense>
  );
}
