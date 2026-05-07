'use client';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import ChatInterface from '../components/chat/ChatInterface';
import { useLanguage } from '../context/LanguageContext';
const Chat = () => {
    const { t } = useLanguage();
    const containerRef = useRef(null);
    const [analytics, setAnalytics] = useState({ cpu: 0, throughput: 0, throughputValue: '0.0' });
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Delay random values slightly for animation effect
        const timer = setTimeout(() => {
            setAnalytics({
                cpu: Math.floor(Math.random() * (85 - 45 + 1)) + 45,
                throughput: Math.floor(Math.random() * (95 - 60 + 1)) + 60,
                throughputValue: (Math.random() * (1.8 - 0.4) + 0.4).toFixed(1)
            });
        }, 500);

        const ctx = gsap.context(() => {
            gsap.from(".animate-fade-in", { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out', stagger: 0.1 });
        });
        return () => {
            ctx.revert();
            clearTimeout(timer);
        };
    }, []);

    return (
        <div ref={containerRef} className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased overflow-hidden transition-colors duration-500">
            {/* CSS Variables & Custom Styles */}
            <style jsx global>{`
                .neural-glass {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(13, 185, 242, 0.1);
                }
                .dark .neural-glass {
                    background: rgba(22, 27, 34, 0.7);
                    border: 1px solid rgba(13, 185, 242, 0.1);
                }
                .neural-bg {
                    background-image: radial-gradient(circle at 2px 2px, rgba(13, 185, 242, 0.05) 1px, transparent 0);
                    background-size: 24px 24px;
                }
                .neon-glow-cyan {
                    box-shadow: 0 0 15px rgba(13, 185, 242, 0.3);
                }
                .neon-glow-magenta {
                    box-shadow: 0 0 15px rgba(255, 0, 255, 0.4);
                }
                .ai-bubble-gradient {
                    background: linear-gradient(135deg, rgba(13, 185, 242, 0.1), rgba(13, 185, 242, 0.05));
                }
            `}</style>

            <div className="flex h-screen w-full flex-col md:flex-row">
                {/* Left Sidebar - Global Feed & Analytics */}
                <aside className="hidden md:flex w-80 flex-col border-r border-slate-200 dark:border-slate-800 neural-glass animate-fade-in">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                    <i className="hn hn-chart-network text-primary text-xl" />
                                </div>
                                <div
                                    className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white dark:border-background-dark flex items-center justify-center transition-all duration-500 cursor-pointer ${isOnline ? 'bg-[#39ff14] shadow-[0_0_10px_#39ff14]' : 'bg-slate-500'}`}
                                    onClick={() => setIsOnline(!isOnline)}
                                    title={isOnline ? "Online" : "Offline"}
                                >
                                    {!isOnline && <i className="hn hn-moon text-[8px] text-white" />}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">pantcake IA</h2>
                                <span className="text-[9px] uppercase tracking-widest text-primary font-bold">Neural Link: Active</span>
                            </div>
                        </div>

                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4">Neural Analytics</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                    <span>CPU UTILIZATION</span>
                                    <span className="text-accent-magenta">{analytics.cpu}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent-magenta transition-all duration-[1500ms] ease-out neon-glow-magenta"
                                        style={{ width: `${analytics.cpu}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                    <span>DATA THROUGHPUT</span>
                                    <span className="text-accent-magenta">{analytics.throughputValue} GB/S</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent-magenta transition-all duration-[1500ms] ease-out neon-glow-magenta"
                                        style={{ width: `${analytics.throughput}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Active Nodes</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                                <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                                    <i className="hn hn-chart-line text-primary text-sm" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Market_Bot_v3</p>
                                    <p className="text-[10px] text-slate-500">Scanning Nasdaq-100</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                                <div className="w-8 h-8 rounded bg-accent-magenta/20 flex items-center justify-center">
                                    <i className="hn hn-lock text-accent-magenta text-sm" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Shield_Core</p>
                                    <p className="text-[10px] text-slate-500">Firewall Integrity 99%</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary fill-current">
                                        <path d="M15,9H9V15H15V9M13,13H11V11H13V13M9,21V19H7V17H5V15H3V13H1V11H3V9H5V7H7V5H9V3H11V1H13V3H15V5H17V7H19V9H21V11H23V13H21V15H19V17H17V19H15V21H13V23H11V21H9M11,19V21H13V19H15V17H17V15H19V13H21V11H19V9H17V7H15V5H13V3H11V5H9V7H7V9H5V11H3V13H5V15H7V17H9V19H11Z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0 ml-1">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">Núcleo Navegante</p>
                                    <p className="text-[10px] text-slate-500">Tier: Elite</p>
                                </div>
                                <i className="hn hn-cog text-slate-500 text-sm cursor-pointer hover:text-primary transition-colors" />
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="aspect-video w-full rounded-xl relative overflow-hidden neural-glass border border-primary/20 group">
                                <div className="absolute inset-0 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent z-10"></div>
                                <div className="absolute inset-0 opacity-40 group-hover:scale-110 transition-transform duration-700 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center"></div>
                                <div className="absolute bottom-3 left-3 z-20">
                                    <p className="text-[10px] font-bold text-primary tracking-widest uppercase">Visualizer Active</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Chat Area */}
                <section className="flex-1 flex flex-col relative neural-bg overflow-hidden">
                    {/* Header */}
                    <header className="h-16 flex items-center justify-between px-6 neural-glass border-b border-slate-200 dark:border-slate-800 z-10 animate-fade-in">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Global Thread_01</h3>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                    Processing Unit: Quantum-8
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 text-slate-500">
                                <i className="hn hn-search text-xl" />
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 text-slate-500">
                                <i className="hn hn-ellipses-vertical text-xl" />
                            </button>
                            <div className="h-6 w-px bg-slate-300 dark:bg-slate-800 mx-2"></div>
                            <button className="bg-primary dark:text-white text-background-dark px-4 py-1.5 rounded-lg text-[8px] font-bold neon-glow-cyan hover:scale-105 transition-transform">
                                UPGRADE LINK
                            </button>
                        </div>
                    </header>

                    {/* System Message */}
                    <div className="w-full flex justify-center py-4 animate-fade-in">
                        <div className="bg-primary/5 border border-primary/20 px-4 py-1 rounded-full">
                            <p className="text-[7px] font-bold text-primary tracking-[0.2em] uppercase">
                                Encriptación Neuronal: Activado • Estado AI: Óptimo • Link Latency: 1ms
                            </p>
                        </div>
                    </div>

                    {/* Chat Component Integration */}
                    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in px-4 md:px-6">
                        <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col h-full">
                            <ChatInterface />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Chat;
