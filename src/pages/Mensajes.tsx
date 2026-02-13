'use client';
import React, { useState, useRef, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { FaUser, FaImage, FaPaperPlane, FaTrash, FaGlobeAmericas, FaSmile, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { addWallMessage, subscribeToWallMessages } from '../utils/firebase';

// Simple list of countries (can be fetched from API in future)
const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador",
  "El Salvador", "España", "Estados Unidos", "Guatemala", "Honduras", "México", "Nicaragua",
  "Panamá", "Paraguay", "Perú", "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela", "Otro"
];

interface Message {
  id: number;
  username: string;
  country: string;
  text: string;
  image: string | null;
  timestamp: string;
  color: string;
}

const MensajesContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'write' | 'read' | 'view'>('write'); // Fixed typing
  const [messages, setMessages] = useState<Message[]>([]);

  // Form State
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false); // Track if form has unsaved changes

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Subscribe to Wall Messages
  useEffect(() => {
    const unsubscribe = subscribeToWallMessages((newMessages) => {
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
    const handleBeforeUnload = (e) => {
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
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiData) => {
    setMessageText((prev) => prev + emojiData.emoji);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsLoading(true);
      setErrors({ ...errors, image: '' });

      // Simulate file analysis
      setTimeout(() => {
        if (file.size > 10 * 1024 * 1024) { // 10MB
          setErrors((prev) => ({ ...prev, image: 'El archivo es demasiado grande (máx. 10MB)' }));
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
    if (!username.trim()) newErrors.username = 'Falta el usuario';
    if (!country.trim()) newErrors.country = 'Falta el país';
    if (!messageText.trim()) newErrors.message = 'Falta el mensaje';

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    setIsLoading(true);

    try {
        let imageUrl: string | null = null;
        if (selectedImage) {
            imageUrl = await uploadImage(selectedImage);
            if (!imageUrl) {
                setErrors({ ...errors, image: 'Error al subir la imagen' });
                setIsLoading(false);
                return;
            }
        }

        await addWallMessage(username, country, messageText, imageUrl);

        setIsDirty(false);
        setShowSuccessModal(true);
    } catch (error) {
        console.error("Error sending message:", error);
        setErrors({ ...errors, form: 'Error al enviar el mensaje. Intenta de nuevo.' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleCloseSuccessModal = (viewMessages = false) => {
    setShowSuccessModal(false);
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

  const handleDelete = (id) => {
    setMessages(messages.filter(msg => msg.id !== id));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/mensajes?view=${tab}`);
  }

  const getRandomColor = () => {
    const colors = [
      'bg-pink-500/20 border-pink-500/30',
      'bg-purple-500/20 border-purple-500/30',
      'bg-blue-500/20 border-blue-500/30',
      'bg-green-500/20 border-green-500/30',
      'bg-yellow-500/20 border-yellow-500/30',
      'bg-orange-500/20 border-orange-500/30',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };


  return (
    <div className="min-h-screen bg-pattern dark:bg-pattern pt-20 pb-10">
      <div className="container mx-auto px-4">

        {/* Header & Tabs */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic neon-text-pink mb-8">
            Muro de Pantcookies
          </h1>

          <div className="flex justify-center gap-6 mb-10">
            <button
              onClick={() => handleTabChange('write')}
              className={`${activeTab === 'write' ? 'poke-button-pink' : 'poke-button bg-white dark:bg-gray-800 text-gray-400 border-gray-300'}`}
            >
              <FaPaperPlane className="inline mr-2" /> Escribir
            </button>
            <button
              onClick={() => handleTabChange('read')}
              className={`${activeTab === 'read' ? 'poke-button-blue' : 'poke-button bg-white dark:bg-gray-800 text-gray-400 border-gray-300'}`}
            >
              <FaImage className="inline mr-2" /> Leer
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto">

          {/* WRITE MODE */}
          {activeTab === 'write' && (
            <div className="max-w-2xl mx-auto poke-card p-6 md:p-10 animate-fade-in-up">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-pokemon-pink mb-3">Usuario</label>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full bg-white dark:bg-black border-4 ${errors.username ? 'border-red-500' : 'border-black'} rounded-xl py-4 pl-12 pr-4 text-[var(--poke-text)] placeholder-gray-400 focus:outline-none transition-all font-black uppercase text-xs tracking-wider`}
                      placeholder="Tu nombre de Pantcookie"
                    />
                  </div>
                  {errors.username && <p className="text-red-500 text-xs mt-1 font-bold uppercase tracking-tight">{errors.username}</p>}
                </div>

                {/* Country Dropdown */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-pokemon-blue mb-3">País</label>
                  <div className="relative">
                    <FaGlobeAmericas className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={`w-full bg-white dark:bg-black border-4 ${errors.country ? 'border-red-500' : 'border-black'} rounded-xl py-4 pl-12 pr-4 text-[var(--poke-text)] placeholder-gray-400 focus:outline-none transition-all appearance-none cursor-pointer font-black uppercase text-xs tracking-wider`}
                    >
                      <option value="" className="bg-[var(--poke-bg)]">Selecciona tu país</option>
                      {COUNTRIES.map(c => (
                        <option key={c} value={c} className="bg-[var(--poke-bg)]">{c}</option>
                      ))}
                    </select>
                  </div>
                  {errors.country && <p className="text-red-500 text-xs mt-1 font-bold uppercase tracking-tight">{errors.country}</p>}
                </div>

                {/* Message */}
                <div className="relative">
                  <label className="block text-xs font-black uppercase tracking-widest text-pokemon-pink mb-3">Mensaje</label>
                  <div className="relative">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className={`w-full bg-white dark:bg-black border-4 ${errors.message ? 'border-red-500' : 'border-black'} rounded-xl py-4 px-4 text-[var(--poke-text)] placeholder-gray-400 focus:outline-none transition-all h-40 resize-none font-medium text-sm`}
                      placeholder="Escribe algo genial..."
                    />
                    <button
                      type="button"
                      aria-label="Insertar emoji"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute bottom-4 right-4 text-gray-500 hover:text-[#ff00ff] transition-colors"
                    >
                      <FaSmile size={24} />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute right-0 bottom-full mb-2 z-50" ref={emojiPickerRef}>
                        <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.DARK} width={300} height={400} />
                      </div>
                    )}
                  </div>
                  {errors.message && <p className="text-red-500 text-xs mt-1 font-bold uppercase tracking-tight">{errors.message}</p>}
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#00ffff] mb-2">Imagen (Opcional, máx 10MB)</label>

                  {!imagePreview ? (
                    <div className="relative border border-dashed border-white/20 rounded-lg p-6 bg-black/20 hover:bg-black/40 transition-all text-center cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isLoading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      {isLoading ? (
                        <div className="flex flex-col items-center justify-center gap-2 text-[#00ffff]">
                          <div className="w-8 h-8 border-2 border-[#00ffff] border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Analizando...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-gray-500 group-hover:text-[#00ffff] transition-colors">
                          <FaImage size={24} />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{selectedImage ? selectedImage.name : 'Subir Archivo'}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative mt-4 w-full h-48 rounded-lg overflow-hidden border border-white/10 group shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                      <Image src={imagePreview} alt="Vista previa" fill className="object-cover" />
                      {/* Hover Delete Action */}
                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={removeImage}
                          aria-label="Eliminar imagen"
                          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-[0_0_15px_rgba(220,38,38,0.5)] transform hover:scale-110 transition-transform"
                          title="Eliminar imagen"
                        >
                          <FaTrash size={20} />
                        </button>
                      </div>
                    </div>
                  )}

                  {errors.image && <p className="text-red-500 bg-red-950/40 border border-red-500/50 py-2 px-4 rounded-lg text-xs mt-2 font-bold uppercase tracking-tight">{errors.image}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="poke-button-pink w-full py-5 text-sm"
                >
                  <FaPaperPlane /> {isLoading ? 'Procesando...' : 'Publicar'}
                </button>
              </form>
            </div>
          )}

          {/* READ MODE (Masonry Layout) */}
          {activeTab === 'read' && (
            <div>
              {messages.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center text-gray-400">
                  <FaImage size={64} className="mb-4 opacity-50" />
                  <p className="text-2xl italic">El muro está vacío...</p>
                  <p className="mt-2">¡Sé el primero en escribir un mensaje!</p>
                  <button onClick={() => handleTabChange('write')} className="mt-6 text-pink-400 hover:text-pink-300 font-bold underline">
                    Ir a escribir
                  </button>
                </div>
              ) : (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                  {messages.map((msg) => (
                    <div key={msg.id} className="break-inside-avoid poke-card mb-6 p-6 group relative overflow-hidden animate-fade-in-up">
                      {/* Decorative corner */}
                      <div className="absolute top-0 right-0 w-12 h-12 bg-pokemon-yellow border-b-4 border-l-4 border-black" />

                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff00ff] to-[#00ffff] flex items-center justify-center font-black text-white shadow-[0_0_10px_rgba(255,0,255,0.4)] text-lg">
                            {msg.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-black uppercase tracking-tight text-md text-[#ff00ff] leading-none mb-1">{msg.username}</h3>
                            <div className="flex items-center text-[10px] font-bold text-blue-800 dark:text-[#00ffff] uppercase tracking-widest gap-1 opacity-80">
                              <FaGlobeAmericas size={8} />
                              <span>{msg.country}</span>
                            </div>
                          </div>
                        </div>
                        {/* Circle Badge or something */}
                        <button onClick={() => handleDelete(msg.id)} aria-label="Borrar mensaje" className="text-white/20 hover:text-red-500 transition-colors">
                          <FaTrash size={12} />
                        </button>
                      </div>

                      {msg.image && (
                        <div className="rounded-lg overflow-hidden shadow-md mb-4 border-4 border-black relative group/img">
                          <Image 
                            src={msg.image} 
                            alt="User upload" 
                            width={0} 
                            height={0} 
                            sizes="100vw" 
                            className="w-full h-auto object-cover transition-all duration-500" 
                          />
                        </div>
                      )}

                      <p className="text-black dark:text-gray-100 text-sm whitespace-pre-wrap leading-relaxed font-bold tracking-wide">
                        {msg.text}
                      </p>

                      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-white">
                        <span className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-[#ff00ff] animate-pulse" />
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 rounded-3xl p-8 max-w-sm w-full border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.3)] text-center transform scale-100 animate-bounce-in">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="text-green-500 text-5xl" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">¡Enviado!</h3>
            <p className="text-gray-300 mb-8">Se ha enviado correctamente su mensaje.</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleCloseSuccessModal(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
              >
                Ver mensaje
              </button>
              <button
                onClick={() => handleCloseSuccessModal(false)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Escribir otro
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
