'use client';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import ChatInterface from '../components/chat/ChatInterface';
import { useLanguage } from '../context/LanguageContext';

const Chat = () => {
    const { t } = useLanguage();
    const containerRef = useRef(null);
    const [analytics, setAnalytics] = useState({ cpu: 42, throughput: 65, throughputValue: '1.2' });
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Random Analytics on refresh
        setAnalytics({
            cpu: Math.floor(Math.random() * (60 - 30 + 1)) + 30,
            throughput: Math.floor(Math.random() * (90 - 40 + 1)) + 40,
            throughputValue: (Math.random() * (2.5 - 0.5) + 0.5).toFixed(1)
        });

        const ctx = gsap.context(() => {
            gsap.from(".animate-fade-in", { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out', stagger: 0.1 });
        });
        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased overflow-hidden transition-colors duration-500">
            {/* CSS Variables & Custom Styles */}
            <style jsx global>{`
                .glass-panel {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(13, 185, 242, 0.1);
                }
                .dark .glass-panel {
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
                    box-shadow: 0 0 15px rgba(255, 0, 255, 0.2);
                }
                .ai-bubble-gradient {
                    background: linear-gradient(135deg, rgba(13, 185, 242, 0.1), rgba(13, 185, 242, 0.05));
                }
            `}</style>

            <div className="flex h-screen w-full flex-col md:flex-row">
                {/* Left Sidebar - Global Feed & Analytics */}
                <aside className="hidden md:flex w-80 flex-col border-r border-slate-200 dark:border-slate-800 glass-panel animate-fade-in">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                    <span className="material-symbols-outlined text-primary text-xl">hub</span>
                                </div>
                                <div 
                                    className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white dark:border-background-dark flex items-center justify-center transition-all duration-500 cursor-pointer ${isOnline ? 'bg-[#39ff14] shadow-[0_0_10px_#39ff14]' : 'bg-slate-500'}`}
                                    onClick={() => setIsOnline(!isOnline)}
                                    title={isOnline ? "Online" : "Offline"}
                                >
                                    {!isOnline && <span className="material-symbols-outlined text-[8px] text-white">dark_mode</span>}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">Pantcookie IA</h2>
                                <span className="text-[9px] uppercase tracking-widest text-primary font-bold">Neural Link: Active</span>
                            </div>
                        </div>

                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4">Neural Analytics</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                                    <span>CPU UTILIZATION</span>
                                    <span className="text-accent-magenta">{analytics.cpu}%</span>
                                </div>
                                <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-accent-magenta transition-all duration-1000 ease-out neon-glow-magenta" 
                                        style={{ width: `${analytics.cpu}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                                    <span>DATA THROUGHPUT</span>
                                    <span className="text-accent-magenta">{analytics.throughputValue} GB/S</span>
                                </div>
                                <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-accent-magenta transition-all duration-1000 ease-out neon-glow-magenta" 
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
                                    <span className="material-symbols-outlined text-primary text-sm">show_chart</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Market_Bot_v3</p>
                                    <p className="text-[10px] text-slate-500">Scanning Nasdaq-100</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                                <div className="w-8 h-8 rounded bg-accent-magenta/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-accent-magenta text-sm">security</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Shield_Core</p>
                                    <p className="text-[10px] text-slate-500">Firewall Integrity 99%</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent-magenta"></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">Core_Navigator</p>
                                    <p className="text-[10px] text-slate-500">Tier: Elite</p>
                                </div>
                                <span className="material-symbols-outlined text-slate-500 text-sm cursor-pointer hover:text-primary transition-colors">settings</span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="aspect-video w-full rounded-xl relative overflow-hidden glass-panel border border-primary/20 group">
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
                <main className="flex-1 flex flex-col relative neural-bg overflow-hidden">
                    {/* Header */}
                    <header className="h-16 flex items-center justify-between px-6 glass-panel border-b border-slate-200 dark:border-slate-800 z-10 animate-fade-in">
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
                                <span className="material-symbols-outlined text-xl">search</span>
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 text-slate-500">
                                <span className="material-symbols-outlined text-xl">more_vert</span>
                            </button>
                            <div className="h-6 w-px bg-slate-300 dark:bg-slate-800 mx-2"></div>
                            <button className="bg-primary dark:text-white text-background-dark px-4 py-1.5 rounded-lg text-xs font-bold neon-glow-cyan hover:scale-105 transition-transform">
                                UPGRADE LINK
                            </button>
                        </div>
                    </header>

                    {/* System Message */}
                    <div className="w-full flex justify-center py-4 animate-fade-in">
                        <div className="bg-primary/5 border border-primary/20 px-4 py-1 rounded-full">
                            <p className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
                                Neural Encryption Active • AI Status: Optimized • Link Latency: 4ms
                            </p>
                        </div>
                    </div>

                    {/* Chat Component Integration */}
                    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in px-4 md:px-6">
                        <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col h-full">
                            <ChatInterface />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Chat;
