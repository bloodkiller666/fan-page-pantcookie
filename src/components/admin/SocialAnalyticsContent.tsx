'use client';
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { FaYoutube, FaTwitch, FaDiscord } from 'react-icons/fa';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiPieChart, FiBarChart2 } from 'react-icons/fi';
import { MdSync, MdMonitor } from 'react-icons/md';
import { supabase } from '../../utils/supabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SocialAnalyticsContent() {
    const [loading, setLoading] = useState(true);
    const [activePlatform, setActivePlatform] = useState<'all' | 'twitch' | 'youtube' | 'discord'>('all');
    const [data, setData] = useState<any[]>([]);
    const [summary, setSummary] = useState({
        twitch: { current: 0, growth: 0 },
        youtube: { current: 0, growth: 0 },
        discord: { current: 0, growth: 0 }
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: rawHistory, error: dbError } = await supabase
                .from('social_metrics')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(90);

            if (dbError) throw dbError;

            let chartData: any[] = [];
            if (rawHistory && rawHistory.length > 0) {
                const grouped = rawHistory.reduce((acc: any, curr: any) => {
                    const time = format(new Date(curr.created_at), 'dd MMM', { locale: es });
                    if (!acc[time]) acc[time] = { name: time, twitch: 0, youtube: 0, discord: 0 };
                    acc[time][curr.platform] = curr.count;
                    return acc;
                }, {});
                chartData = Object.values(grouped);
            } else {
                // Fallback / Initial state
                const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Hoy'];
                chartData = days.map((day) => ({ name: day, twitch: 0, youtube: 0, discord: 0 }));
            }

            setData(chartData);

            const latest = chartData[chartData.length - 1] || {};
            const previous = chartData[chartData.length - 2] || {};

            const calcGrowth = (p: string) => (latest[p] && previous[p]) ? latest[p] - previous[p] : 0;

            setSummary({
                twitch: { current: latest.twitch || 0, growth: calcGrowth('twitch') },
                youtube: { current: latest.youtube || 0, growth: calcGrowth('youtube') },
                discord: { current: latest.discord || 0, growth: calcGrowth('discord') }
            });

        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const handleRefresh = () => fetchData();
        window.addEventListener('refresh-analytics', handleRefresh);
        return () => window.removeEventListener('refresh-analytics', handleRefresh);
    }, []);

    const handleManualSync = async () => {
        setLoading(true);
        try {
            const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
            await fetch('/api/admin/sync-metrics', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${adminPassword}`
                }
            });
            await fetchData();
        } catch (e) {
            console.error("Sync failed", e);
        } finally {
            setLoading(false);
        }
    };

    const GrowthIndicator = ({ val }: { val: number }) => {
        if (val > 0) return (
            <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                <span>{val.toLocaleString()}</span>
                <FiTrendingUp />
            </div>
        );
        if (val < 0) return (
            <div className="flex items-center gap-1 text-rose-500 font-bold text-xs">
                <span>{Math.abs(val).toLocaleString()}</span>
                <FiTrendingDown />
            </div>
        );
        return <FiMinus className="text-zinc-500 text-xs" />;
    };

    const COLORS = {
        twitch: '#8b5cf6',
        youtube: '#ef4444',
        discord: '#6366f1'
    };

    const pieData = [
        { name: 'Twitch', value: summary.twitch.current, color: COLORS.twitch },
        { name: 'YouTube', value: summary.youtube.current, color: COLORS.youtube },
        { name: 'Discord', value: summary.discord.current, color: COLORS.discord }
    ].filter(d => d.value > 0);

    const barData = [
        { name: 'Twitch', total: summary.twitch.current, fill: COLORS.twitch },
        { name: 'YouTube', total: summary.youtube.current, fill: COLORS.youtube },
        { name: 'Discord', total: summary.discord.current, fill: COLORS.discord }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header / Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { id: 'twitch', icon: FaTwitch, color: 'text-purple-500', label: 'Followers', val: summary.twitch.current, growth: summary.twitch.growth, bg: 'bg-purple-500/10' },
                    { id: 'youtube', icon: FaYoutube, color: 'text-red-500', label: 'Subscribers', val: summary.youtube.current, growth: summary.youtube.growth, bg: 'bg-red-500/10' },
                    { id: 'discord', icon: FaDiscord, color: 'text-indigo-500', label: 'Members', val: summary.discord.current, growth: summary.discord.growth, bg: 'bg-indigo-500/10' }
                ].map((p) => (
                    <button
                        key={p.id}
                        onClick={() => setActivePlatform(p.id as any)}
                        className={`glass-panel p-6 rounded-3xl border transition-all flex items-center justify-between group ${activePlatform === p.id ? `border-${p.id === 'twitch' ? 'purple' : p.id === 'youtube' ? 'red' : 'indigo'}-500/50 ${p.bg}` : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                <p.icon className={`${p.color} text-xl`} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{p.label}</p>
                                <h3 className="text-xl font-display font-black dark:text-white">{p.val.toLocaleString()}</h3>
                            </div>
                        </div>
                        <GrowthIndicator val={p.growth} />
                    </button>
                ))}
            </div>

            {/* Main Trend Chart Section */}
            <section className="glass-panel backdrop-blur-xl bg-white dark:bg-slate-900/40 rounded-3xl border border-white/5 p-8 relative min-h-[450px]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-8 bg-primary rounded-full"></div>
                        <div>
                            <h2 className="font-display font-extrabold text-xl tracking-tight uppercase text-white flex items-center gap-2">
                                Tendencia de Crecimiento
                                {loading && <span className="w-2 h-2 rounded-full bg-primary animate-ping ml-1"></span>}
                            </h2>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Real-time Performance Metrics</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleManualSync}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-all border border-primary/20 disabled:opacity-50"
                        >
                            <MdSync className={`text-lg ${loading ? 'animate-spin' : ''}`} /> SYNC NOW
                        </button>
                        <button
                            onClick={() => setActivePlatform('all')}
                            className={`text-[10px] font-bold px-4 py-2 rounded-xl border transition-all ${activePlatform === 'all' ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(255,31,142,0.3)]' : 'border-white/10 text-zinc-500 hover:text-white hover:bg-white/5'}`}
                        >
                            VER TODO
                        </button>
                    </div>
                </div>

                {loading && data.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Initializing Streams...</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorTwitch" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorYT" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorDiscord" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#666"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    padding={{ left: 10, right: 10 }}
                                />
                                <YAxis
                                    hide
                                    domain={['dataMin - 10', 'dataMax + 10']}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#09090b',
                                        border: '1px solid #ffffff10',
                                        borderRadius: '16px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                                    }}
                                    itemStyle={{ padding: '2px 0' }}
                                />
                                {(activePlatform === 'all' || activePlatform === 'twitch') && (
                                    <Area type="monotone" dataKey="twitch" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTwitch)" animationDuration={1500} />
                                )}
                                {(activePlatform === 'all' || activePlatform === 'youtube') && (
                                    <Area type="monotone" dataKey="youtube" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorYT)" animationDuration={1500} />
                                )}
                                {(activePlatform === 'all' || activePlatform === 'discord') && (
                                    <Area type="monotone" dataKey="discord" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorDiscord)" animationDuration={1500} />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </section>

            {/* New Charts Section: Bar + Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Distribution Pie Chart */}
                <div className="glass-panel backdrop-blur-xl bg-white dark:bg-slate-900/40 rounded-3xl border border-white/5 p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <FiPieChart className="text-primary text-xl" />
                            <h3 className="font-display font-bold text-sm uppercase tracking-widest dark:text-white">Share de Audiencia</h3>
                        </div>
                    </div>
                    <div className="h-[250px] w-full flex items-center justify-center">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        animationDuration={1500}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                        labelStyle={{ display: 'none' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-zinc-500 font-mono text-[10px] uppercase">Awaiting Data...</p>
                        )}
                    </div>
                </div>

                {/* Totals Comparison Bar Chart */}
                <div className="glass-panel backdrop-blur-xl bg-white dark:bg-slate-900/40 rounded-3xl border border-white/5 p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <FiBarChart2 className="text-[#00f2ff] text-xl" />
                            <h3 className="font-display font-bold text-sm uppercase tracking-widest dark:text-white">Comparativa de Totales</h3>
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                />
                                <Bar
                                    dataKey="total"
                                    radius={[0, 10, 10, 0]}
                                    barSize={20}
                                    animationDuration={1500}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between px-2 opacity-30 mt-4">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Data Orchestration Engine v2.4</span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.3em] font-mono">STATUS: OPTIMAL_RESPONSE</span>
            </div>
        </div>
    );
}
