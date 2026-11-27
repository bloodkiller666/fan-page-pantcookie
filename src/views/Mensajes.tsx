'use client';
import React, { useState, useRef, useEffect, Suspense } from 'react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { MdAddPhotoAlternate, MdCheckCircle, MdClose, MdEdit, MdForum, MdMood, MdSend, MdWarning } from 'react-icons/md';
import { addWallMessage, subscribeToWallMessages } from '../utils/firebase';
import { useLanguage } from '../context/LanguageContext';
import { useScrollReveal } from '../hooks/useScrollReveal';
import RevealTitle from '../components/ui/RevealTitle';
import GameDialog from '../components/game/GameDialog';
import MessageCard, { WallMessage } from '../components/wall/MessageCard';

// Simple list of countries (can be fetched from an API in the future)
const COUNTRIES = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador',
  'El Salvador', 'España', 'Estados Unidos', 'Guatemala', 'Honduras', 'México', 'Nicaragua',
  'Panamá', 'Paraguay', 'Perú', 'Puerto Rico', 'República Dominicana', 'Uruguay', 'Venezuela', 'Otro',
];

const MAX_WORDS = 2000;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

const countWords = (str: string) => (str.trim() === '' ? 0 : str.trim().split(/\s+/).length);

const inputClass =
  'w-full border-[3px] border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 font-display text-lg font-bold text-[var(--text)] shadow-[inset_4px_4px_0_rgba(0,0,0,0.12)] placeholder:font-medium placeholder:text-[var(--muted)] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]';

function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block font-display text-sm font-bold uppercase tracking-[0.12em]">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-2 flex items-center gap-2 font-display text-sm font-bold uppercase text-[var(--pink)]">
          <MdWarning aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}

const MensajesContent = () => {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'write' | 'read'>('write');
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<WallMessage | null>(null);

  // Form state
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [messageText, setMessageText] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<'idle' | 'analyzing' | 'completed'>('idle');
  const [textCheck, setTextCheck] = useState<'loading' | 'pass' | 'fail'>('loading');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [successStatus, setSuccessStatus] = useState<'approved' | 'banned' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Live wall (approved messages only; moderation status is stored with each message)
  useEffect(() => {
    const unsubscribe = subscribeToWallMessages((incoming) => {
      setMessages(
        incoming.map((msg) => ({
          id: String(msg.id),
          username: msg.username,
          country: msg.country,
          text: msg.text,
          image: msg.imageUrl,
          timestamp: (msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)).toLocaleString(language),
        }))
      );
    });
    return () => unsubscribe();
  }, [language]);

  // Deep link: /mensajes?view=read
  useEffect(() => {
    const view = searchParams?.get('view');
    if (view === 'read' || view === 'write') setActiveTab(view);
  }, [searchParams]);

  // Warn before leaving with an unsent message
  useEffect(() => {
    setIsDirty(!!(username || country || messageText || selectedImage));
  }, [username, country, messageText, selectedImage]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) setShowEmojiPicker(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tab content slides in; message cards reveal as they scroll into view
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.wall-panel', { opacity: 0, y: 28, duration: 0.55, ease: 'power3.out', clearProps: 'transform,opacity' });
    }, rootRef);
    return () => mm.revert();
  }, [activeTab]);
  useScrollReveal(rootRef, [activeTab, messages.length, language]);

  const handleEmojiClick = (emojiData: EmojiClickData) => setMessageText((prev) => prev + emojiData.emoji);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrors((prev) => ({ ...prev, image: '' }));

    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((prev) => ({ ...prev, image: t('wall.imageSizeError') }));
      setSelectedImage(null);
      setImagePreview(null);
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    setUsername('');
    setCountry('');
    setMessageText('');
    removeImage();
    setErrors({});
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
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) return data.url;
      throw new Error(data.error || 'Upload failed');
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (honeypot) return; // silent rejection for bots

    setIsLoading(true);
    setAnalysisPhase('analyzing');
    setTextCheck('loading');

    try {
      let imageUrl: string | null = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          setErrors((prev) => ({ ...prev, image: t('wall.imageUploadError') }));
          setAnalysisPhase('idle');
          return;
        }
      }

      // AI moderation: anything unclear is held for review
      let status: 'approved' | 'banned' = 'banned';
      const moderationResponse = await fetch('/api/moderate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText }),
      });
      if (moderationResponse.ok) {
        const result = await moderationResponse.json();
        status = result.status === 'banned' ? 'banned' : 'approved';
      } else {
        console.error('Moderation API error:', moderationResponse.status);
      }
      setTextCheck(status === 'approved' ? 'pass' : 'fail');

      // Let the visitor see the result before moving on
      await new Promise((r) => setTimeout(r, 1200));

      await addWallMessage(username, country, messageText, imageUrl, status);

      setIsDirty(false);
      setAnalysisPhase('completed');
      setSuccessStatus(status);
    } catch (error) {
      console.error('Error sending message:', error);
      setErrors((prev) => ({ ...prev, form: t('wall.submitError') }));
      setAnalysisPhase('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const closeSuccess = (viewMessages: boolean) => {
    setSuccessStatus(null);
    setAnalysisPhase('idle');
    resetForm();
    if (viewMessages) {
      setActiveTab('read');
      router.push('/mensajes?view=read');
    }
  };

  const handleTabChange = (tab: 'write' | 'read') => {
    setActiveTab(tab);
    router.push(`/mensajes?view=${tab}`);
  };

  // Set after mount: the server and the browser disagree about "now"
  const [nowLabel, setNowLabel] = useState('');
  useEffect(() => setNowLabel(new Date().toLocaleString(language)), [language]);

  const wordsUsed = countWords(messageText);
  const draft = {
    username: username || t('wall.yourName'),
    country: country || t('wall.countryPlaceholder'),
    text: messageText || t('wall.messagePlaceholder'),
    image: imagePreview,
    timestamp: nowLabel,
  };

  const tabClass = (active: boolean, tone: string) =>
    `flex min-h-[3.25rem] items-center gap-3 border-[3px] border-b-0 border-[var(--line)] px-6 font-display text-base font-bold uppercase tracking-[0.06em] transition-colors ${
      active ? `${tone} text-[var(--ink)]` : 'bg-[var(--surface-2)] hover:bg-[var(--yellow)] hover:text-[var(--ink)]'
    }`;

  return (
    <div ref={rootRef} className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 sm:py-16">
      <RevealTitle as="h1" className="font-display text-[clamp(2.6rem,7vw,5.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
        {t('wall.title')}
      </RevealTitle>

      {/* Tabs */}
      <div role="tablist" aria-label={t('wall.title')} className="mt-10 flex items-end gap-2 border-b-[3px] border-[var(--line)]">
        <button type="button" role="tab" id="tab-write" aria-selected={activeTab === 'write'} aria-controls="panel-main" onClick={() => handleTabChange('write')} className={tabClass(activeTab === 'write', 'bg-[var(--pink)]')}>
          <MdEdit className="text-2xl" aria-hidden />
          {t('wall.write')}
        </button>
        <button type="button" role="tab" id="tab-read" aria-selected={activeTab === 'read'} aria-controls="panel-main" onClick={() => handleTabChange('read')} className={tabClass(activeTab === 'read', 'bg-[var(--cyan)]')}>
          <MdForum className="text-2xl" aria-hidden />
          {t('wall.read')}
        </button>
      </div>

      <div id="panel-main" role="tabpanel" aria-labelledby={activeTab === 'write' ? 'tab-write' : 'tab-read'} className="wall-panel pt-12">
        {/* WRITE */}
        {activeTab === 'write' && (
          <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="cart-shell">
              <div className="cart">
                <div className="cart__face p-6 sm:p-8">
                  {analysisPhase !== 'idle' ? (
                    <div className="flex min-h-[26rem] flex-col" role="status" aria-live="polite">
                      <h2 className="font-display text-3xl font-bold uppercase leading-none">{t('wall.analysisTitle')}</h2>
                      <p className="mt-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{t('wall.analysisIntro')}</p>

                      <ul className="mt-8 space-y-5">
                        <li className="flex items-center justify-between gap-4 border-[3px] border-[var(--line)] bg-[var(--surface-2)] p-4">
                          <span className="font-display text-lg font-bold uppercase">{t('wall.checkText')}</span>
                          {textCheck === 'loading' ? (
                            <span className="h-6 w-6 animate-spin border-[3px] border-[var(--line)] border-t-[var(--pink)]" aria-hidden />
                          ) : textCheck === 'pass' ? (
                            <MdCheckCircle className="text-3xl text-[var(--blue)] dark:text-[var(--cyan)]" aria-label="ok" />
                          ) : (
                            <span className="flex items-center gap-2 font-display text-sm font-bold uppercase text-[var(--pink)]">
                              <MdWarning className="text-2xl" aria-hidden />
                              {t('wall.reviewRequired')}
                            </span>
                          )}
                        </li>
                        <li className="flex items-center justify-between gap-4 border-[3px] border-[var(--line)] bg-[var(--surface-2)] p-4">
                          <span className="font-display text-lg font-bold uppercase">{t('wall.checkMedia')}</span>
                          {selectedImage ? <MdCheckCircle className="text-3xl text-[var(--blue)] dark:text-[var(--cyan)]" aria-label="ok" /> : <span className="font-display text-sm font-bold uppercase text-[var(--muted)]">{t('wall.noImage')}</span>}
                        </li>
                      </ul>

                      <div className="mt-auto pt-10">
                        <div className="hud-bar hud-bar--cyan" style={{ ['--v' as string]: textCheck === 'loading' ? 40 : 100 }} />
                        <p className="mt-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{textCheck === 'loading' ? t('wall.sending') : t('wall.sent')}</p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
                      {/* Honeypot: hidden from people, visible to bots */}
                      <input type="text" name="websiteUrl" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden style={{ position: 'absolute', left: '-9999px', opacity: 0 }} />

                      <Field label={t('wall.usernameLabel')} htmlFor="wall-name" error={errors.username}>
                        <input id="wall-name" type="text" value={username} maxLength={15} onChange={(e) => setUsername(e.target.value)} className={inputClass} placeholder={t('wall.usernamePlaceholder')} autoComplete="nickname" />
                      </Field>

                      <Field label={t('wall.countryLabel')} htmlFor="wall-country" error={errors.country}>
                        <select id="wall-country" value={country} onChange={(e) => setCountry(e.target.value)} className={`${inputClass} cursor-pointer`}>
                          <option value="">{t('wall.countryPlaceholder')}</option>
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label={t('wall.messageLabel')} htmlFor="wall-text" error={errors.message}>
                        <div className="relative">
                          <textarea
                            id="wall-text"
                            value={messageText}
                            onChange={(e) => {
                              if (countWords(e.target.value) <= MAX_WORDS) setMessageText(e.target.value);
                            }}
                            maxLength={2000}
                            rows={6}
                            className={`${inputClass} resize-y pr-14 font-body !text-lg !font-medium leading-relaxed`}
                            placeholder={t('wall.messagePlaceholder')}
                          />
                          <button type="button" aria-label={t('wall.emoji')} aria-expanded={showEmojiPicker} onClick={() => setShowEmojiPicker((v) => !v)} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center border-[3px] border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:bg-[var(--yellow)] hover:text-[var(--ink)]">
                            <MdMood className="text-2xl" />
                          </button>
                          {showEmojiPicker && (
                            <div className="absolute bottom-full right-0 z-50 mb-2" ref={emojiPickerRef}>
                              <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.AUTO} width={300} height={380} />
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-4">
                          <div className="hud-bar hud-bar--cyan flex-1" style={{ ['--v' as string]: Math.min(100, (wordsUsed / MAX_WORDS) * 100) }} aria-hidden />
                          <span className="score shrink-0 text-[0.55rem]">{MAX_WORDS - wordsUsed} {t('wall.wordsLeft')}</span>
                        </div>
                      </Field>

                      <Field label={t('wall.imageLabel')} htmlFor="wall-image" error={errors.image}>
                        {!imagePreview ? (
                          <label htmlFor="wall-image" className="flex min-h-24 cursor-pointer items-center justify-center gap-3 border-[3px] border-dashed border-[var(--line)] bg-[var(--surface-2)] px-4 py-5 font-display text-base font-bold uppercase transition-colors hover:bg-[var(--yellow)] hover:text-[var(--ink)] has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]">
                            <MdAddPhotoAlternate className="text-3xl" aria-hidden />
                            {t('wall.chooseImage')}
                            <input ref={fileInputRef} id="wall-image" type="file" accept="image/*" onChange={handleImageChange} disabled={isLoading} className="sr-only" />
                          </label>
                        ) : (
                          <div className="flex items-center gap-4 border-[3px] border-[var(--line)] bg-[var(--surface-2)] p-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imagePreview} alt={t('wall.altUpload')} className="h-20 w-20 border-[3px] border-[var(--line)] object-cover" />
                            <span className="min-w-0 flex-1 truncate font-display text-base font-bold">{selectedImage?.name}</span>
                            <button type="button" onClick={removeImage} aria-label={t('wall.removeImage')} className="flex h-11 w-11 items-center justify-center border-[3px] border-[var(--line)] bg-[var(--pink)] text-[var(--ink)]">
                              <MdClose className="text-2xl" />
                            </button>
                          </div>
                        )}
                      </Field>

                      {errors.form && <p role="alert" className="font-display text-base font-bold uppercase text-[var(--pink)]">{errors.form}</p>}

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        <button type="button" onClick={resetForm} className="btn btn--ghost">{t('wall.reset')}</button>
                        <button type="submit" disabled={isLoading} className="btn !px-8 !py-4 !text-lg">
                          <MdSend className="text-2xl" aria-hidden />
                          {isLoading ? t('wall.submitLoading') : t('wall.submitBase')}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
                <div className="pins" aria-hidden />
              </div>
            </div>

            {/* Live preview */}
            <aside className="lg:sticky lg:top-28" aria-label={t('wall.preview')}>
              <h2 className="font-display text-2xl font-bold uppercase leading-none">{t('wall.preview')}</h2>
              <p className="mb-6 mt-2 text-base font-medium text-[var(--muted)]">{t('wall.previewHint')}</p>
              <MessageCard message={draft} index={1} />
            </aside>
          </div>
        )}

        {/* READ */}
        {activeTab === 'read' &&
          (messages.length === 0 ? (
            <div className="mx-auto max-w-xl border-[3px] border-dashed border-[var(--line)] px-6 py-16 text-center">
              <MdForum className="mx-auto text-6xl text-[var(--muted)]" aria-hidden />
              <p className="mt-4 font-display text-3xl font-bold uppercase leading-none">{t('wall.emptyWall')}</p>
              <p className="mt-3 text-lg font-medium text-[var(--muted)]">{t('wall.emptySub')}</p>
              <button type="button" onClick={() => handleTabChange('write')} className="btn mt-8">{t('wall.emptyGoWrite')}</button>
            </div>
          ) : (
            <>
              <p className="tag tag--cyan mb-10">{t('wall.wallLive')} &middot; {String(t('wall.messagesCount')).replace('{n}', String(messages.length))}</p>
              <div className="columns-1 gap-10 md:columns-2 lg:columns-3">
                {messages.map((msg, index) => (
                  <div key={msg.id} data-reveal className="mb-10 break-inside-avoid">
                    <MessageCard message={msg} index={index} onOpen={() => setSelectedMessage(msg)} />
                  </div>
                ))}
              </div>
            </>
          ))}
      </div>

      {/* Full message */}
      <GameDialog open={!!selectedMessage} onClose={() => setSelectedMessage(null)} title={selectedMessage?.username ?? ''} icon={<MdForum />} tone="cyan" wide>
        {selectedMessage && (
          <div>
            <p className="mb-4 font-display text-sm font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{selectedMessage.country}</p>
            {selectedMessage.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedMessage.image} alt="" className="mb-6 max-h-[50vh] w-full border-[3px] border-[var(--line)] bg-[var(--ink)] object-contain" />
            )}
            <p className="whitespace-pre-wrap break-words text-xl font-semibold leading-relaxed">&ldquo;{selectedMessage.text}&rdquo;</p>
            <div className="mt-6 flex items-center justify-between gap-4 border-t-[3px] border-[var(--line)] pt-4">
              <span className="font-display text-xs font-bold uppercase tracking-[0.12em] opacity-60">{selectedMessage.timestamp}</span>
              <button type="button" onClick={() => setSelectedMessage(null)} className="btn btn--ghost !min-h-10 !py-2 !text-sm">{t('wall.close')}</button>
            </div>
          </div>
        )}
      </GameDialog>

      {/* Sent */}
      <GameDialog open={successStatus !== null} title={successStatus === 'approved' ? t('wall.published') : t('wall.pending')} icon={successStatus === 'approved' ? <MdCheckCircle /> : <MdWarning />} tone={successStatus === 'approved' ? 'cyan' : 'yellow'}>
        <p className="text-lg font-semibold leading-snug">{successStatus === 'approved' ? t('wall.publishedSub') : t('wall.pendingSub')}</p>
        <div className="mt-6 flex flex-col gap-3">
          <button type="button" autoFocus onClick={() => closeSuccess(true)} className="btn">{t('wall.viewMessages')}</button>
          <button type="button" onClick={() => closeSuccess(false)} className="btn btn--ghost">{t('wall.writeAnother')}</button>
        </div>
      </GameDialog>
    </div>
  );
};

export default function Mensajes() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center font-display text-2xl font-bold uppercase">Loading...</div>}>
      <MensajesContent />
    </Suspense>
  );
}
