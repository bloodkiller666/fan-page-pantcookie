'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { getAllWallMessages, deleteWallMessage, updateWallMessage } from '../../../utils/firebase';
import { FiTrash2, FiEdit2, FiSave, FiX, FiFilter, FiSearch, FiLock } from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState<'scores' | 'messages'>('scores');
    const [scores, setScores] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterGame, setFilterGame] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [editMessageForm, setEditMessageForm] = useState<any>({});

    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

    // Auth Check
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            localStorage.setItem('admin_auth', 'true');
            fetchScores();
            fetchMessages();
        } else {
            alert('Contraseña incorrecta');
        }
    };

    useEffect(() => {
        const auth = localStorage.getItem('admin_auth');
        if (auth === 'true') {
            setIsAuthenticated(true);
            fetchScores();
            fetchMessages();
        }
    }, []);

    // Messages Fetching
    const fetchMessages = async () => {
        const msgs = await getAllWallMessages();
        setMessages(msgs);
    };

    // Message CRUD
    const handleDeleteMessage = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este mensaje?')) return;
        
        const result = await deleteWallMessage(id);
        if (result.success) {
            setMessages(messages.filter(m => m.id !== id));
        } else {
            alert('Error al eliminar mensaje');
        }
    };

    const startEditMessage = (msg: any) => {
        setEditingId(msg.id);
        setEditMessageForm({ ...msg });
    };

    const saveEditMessage = async () => {
        const result = await updateWallMessage(editingId!, {
            username: editMessageForm.username,
            text: editMessageForm.text,
            country: editMessageForm.country
        });

        if (result.success) {
            setMessages(messages.map(m => m.id === editingId ? { ...m, ...editMessageForm } : m));
            setEditingId(null);
        } else {
            alert('Error al actualizar mensaje');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('admin_auth');
    };

    // Data Fetching
    const fetchScores = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('game_scores')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) console.error('Error fetching scores:', error);
        else setScores(data || []);
        setLoading(false);
    };

    // CRUD Operations
    const handleDeleteScore = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este puntaje?')) return;
        
        const { error } = await supabase
            .from('game_scores')
            .delete()
            .eq('id', id);

        if (error) alert('Error al eliminar');
        else {
            setScores(scores.filter(s => s.id !== id));
        }
    };

    const startEdit = (score: any) => {
        setEditingId(score.id);
        setEditForm({ ...score });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async () => {
        const { error } = await supabase
            .from('game_scores')
            .update({
                player_name: editForm.player_name,
                score: parseInt(editForm.score),
                difficulty: editForm.difficulty
            })
            .eq('id', editingId);

        if (error) {
            alert('Error al actualizar');
        } else {
            setScores(scores.map(s => s.id === editingId ? { ...s, ...editForm } : s));
            setEditingId(null);
        }
    };

    // Filtering
    const filteredScores = scores.filter(score => {
        const matchesGame = filterGame === 'all' || score.game_type === filterGame;
        const matchesSearch = score.player_name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesGame && matchesSearch;
    });

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6 transition-colors duration-300">
                <div className="fixed inset-0 cyber-grid-bg bg-[radial-gradient(circle,rgba(255,31,142,0.08)_1px,transparent_1px)] opacity-30 pointer-events-none data-grid-bg"></div>
                <form onSubmit={handleLogin} className="relative z-10 glass-panel bg-white/40 dark:bg-slate-900/40 p-10 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-white/10 backdrop-blur-xl">
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center rotate-3 shadow-[0_0_20px_rgba(255,31,142,0.4)]">
                            <span className="material-symbols-outlined text-white text-4xl">bolt</span>
                        </div>
                    </div>
                    <h2 className="text-3xl font-display font-black text-center mb-2 tracking-tighter text-zinc-900 dark:text-white uppercase italic">
                        SHAKE-<span className="text-primary glow-text">GANG</span>
                    </h2>
                    <p className="text-center text-xs font-bold text-zinc-500 dark:text-slate-400 tracking-[0.2em] mb-8 uppercase">
                        Admin Access Protocol
                    </p>
                    <div className="space-y-6">
                        <div className="relative">
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-slate-500" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Master Password"
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-zinc-300 dark:border-white/10 bg-white/50 dark:bg-black/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none"
                            />
                        </div>
                        <button type="submit" className="w-full bg-primary/90 hover:bg-primary text-white font-black tracking-widest text-sm py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(255,31,142,0.3)] hover:shadow-[0_0_25px_rgba(255,31,142,0.5)] border border-primary/50 uppercase">
                            Authenticate
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-zinc-800 dark:text-slate-100 font-sans min-h-screen selection:bg-primary selection:text-white overflow-x-hidden transition-colors duration-300">
            {/* Ambient Background */}
            <div className="fixed inset-0 cyber-grid-bg bg-[radial-gradient(circle,rgba(255,31,142,0.08)_1px,transparent_1px)] opacity-30 pointer-events-none"></div>
            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#00f2ff]/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

            {/* Header */}
            <header className="sticky top-0 z-50 glass-panel backdrop-blur-xl bg-white/80 dark:bg-slate-950/60 border-b border-zinc-200 dark:border-white/5 transition-colors duration-300">
                <div className="max-w-[1800px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform shadow-[0_0_15px_rgba(255,31,142,0.4)]">
                                <span className="material-symbols-outlined text-white text-2xl">bolt</span>
                            </div>
                            <span className="font-display font-extrabold text-2xl tracking-tighter uppercase italic text-zinc-900 dark:text-white">
                                SHAKE-<span className="text-primary glow-text">GANG</span>
                            </span>
                        </div>
                        <nav className="hidden xl:flex items-center gap-8">
                            <button onClick={() => setActiveTab('scores')} className={`flex items-center gap-2 text-[11px] font-bold tracking-widest transition-opacity ${activeTab === 'scores' ? 'text-primary border-b-2 border-primary pb-1' : 'text-zinc-500 dark:text-slate-300 opacity-50 hover:opacity-100'}`}>
                                <span className="material-symbols-outlined text-[18px]">sports_esports</span> PUNTAJES
                            </button>
                            <button onClick={() => setActiveTab('messages')} className={`flex items-center gap-2 text-[11px] font-bold tracking-widest transition-opacity ${activeTab === 'messages' ? 'text-primary border-b-2 border-primary pb-1' : 'text-zinc-500 dark:text-slate-300 opacity-50 hover:opacity-100'}`}>
                                <span className="material-symbols-outlined text-[18px]">forum</span> MENSAJES
                            </button>
                        </nav>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse"></div>
                                <span className="text-[10px] font-bold text-[#39ff14] tracking-widest uppercase">Live System</span>
                            </div>
                            <div className="h-4 w-[1px] bg-zinc-300 dark:bg-white/10"></div>
                            <span className="text-[10px] font-mono text-zinc-500 dark:text-slate-400 uppercase">Nodes: 14 Active</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-zinc-900 dark:text-white">Admin_User</p>
                                <p className="text-[10px] text-zinc-500 dark:text-slate-400">Super Administrator</p>
                            </div>
                            <div className="w-11 h-11 rounded-full bg-zinc-200 dark:bg-slate-800 flex items-center justify-center border-2 border-primary/50 cursor-pointer hover:scale-105 transition-transform overflow-hidden shadow-[0_0_10px_rgba(255,31,142,0.3)]">
                                <img alt="User Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtEzxHfDrJFP0LIH-xX4pA39y9FC6BJGjQHFPBovaG6XKJsGx7IKaznHa-3Bw6W29TpvHglRMcOkNJZk5O29tDTPdo0il1XfU66gyhzltjwRzqe58bXy96Qy8tfg-gz41eHDGrXR0U8djypcDG-23eQswjpC59apEwbmP6ZgqD1Eipxd13u1nJPoUSwM6Pdn6wh3mHJ31IPaJ8uG4wuf5ocmZqzR5bsgpiZ7iWkZMJL4bEgkgSbmr1T4ZUKDOZn0vwcde6arOPuM0" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1800px] mx-auto p-6 grid grid-cols-12 gap-6 relative z-10">
                {/* Sidebar Navigation */}
                <aside className="col-span-12 lg:col-span-1 flex flex-col gap-4">
                    <div className="glass-panel backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-zinc-200 dark:border-white/10 p-3 rounded-2xl flex flex-row lg:flex-col items-center justify-around lg:justify-start gap-4 lg:min-h-[600px]">
                        <button onClick={() => setActiveTab('scores')} className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeTab === 'scores' ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(255,31,142,0.2)]' : 'hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white'}`}>
                            <span className="material-symbols-outlined">sports_esports</span>
                        </button>
                        <button onClick={() => setActiveTab('messages')} className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeTab === 'messages' ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(255,31,142,0.2)]' : 'hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white'}`}>
                            <span className="material-symbols-outlined">forum</span>
                        </button>
                        <button className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white transition-all">
                            <span className="material-symbols-outlined">monitoring</span>
                        </button>
                        <button className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white transition-all">
                            <span className="material-symbols-outlined">shield</span>
                        </button>
                        <div className="flex-grow lg:block hidden"></div>
                        <button onClick={handleLogout} className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-500 dark:text-slate-400 hover:text-red-500 transition-all">
                            <span className="material-symbols-outlined">logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                    {/* Top Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-panel backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 p-6 rounded-3xl border border-primary/30 shadow-[0_0_15px_rgba(255,31,142,0.1)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Total Records</span>
                                <span className="material-symbols-outlined text-primary/40">groups</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <h3 className="text-3xl font-display font-black text-zinc-900 dark:text-white">{activeTab === 'scores' ? scores.length : messages.length}</h3>
                                <span className="text-xs text-[#39ff14] mb-1 font-bold">+Live</span>
                            </div>
                        </div>
                        <div className="glass-panel backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 p-6 rounded-3xl border border-zinc-200 dark:border-white/5 relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold tracking-widest text-[#00f2ff] uppercase">Active Sessions</span>
                                <span className="material-symbols-outlined text-[#00f2ff]/40">sensors</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <h3 className="text-3xl font-display font-black text-zinc-900 dark:text-white">1,204</h3>
                                <span className="text-xs text-[#00f2ff] mb-1 font-bold">Online</span>
                            </div>
                        </div>
                        <div className="glass-panel backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 p-6 rounded-3xl border border-zinc-200 dark:border-white/5 relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold tracking-widest text-zinc-500 dark:text-slate-400 uppercase">Server Uptime</span>
                                <span className="material-symbols-outlined text-zinc-400 dark:text-slate-400/40">dns</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <h3 className="text-3xl font-display font-black text-zinc-900 dark:text-white">99.9<span className="text-sm opacity-50">%</span></h3>
                                <span className="text-xs text-zinc-500 mb-1 font-mono">24d 5h</span>
                            </div>
                        </div>
                    </div>

                    {/* Data Table Section */}
                    <section className="glass-panel backdrop-blur-xl bg-white/80 dark:bg-slate-900/60 rounded-3xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-zinc-200 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-zinc-50 dark:bg-white/5 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-8 bg-primary rounded-full"></div>
                                <div>
                                    <h2 className="font-display font-extrabold text-xl tracking-tight uppercase text-zinc-900 dark:text-white">
                                        {activeTab === 'scores' ? 'Puntajes Globales' : 'Muro de la Fama'}
                                    </h2>
                                    <p className="text-[10px] font-bold text-zinc-500 dark:text-slate-400 uppercase tracking-[0.2em]">Live Database Records</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {activeTab === 'scores' && (
                                    <>
                                        <div className="relative">
                                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                            <input 
                                                type="text" 
                                                placeholder="Buscar jugador..." 
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full sm:w-48 pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/20 text-zinc-900 dark:text-white focus:border-primary outline-none transition-colors"
                                            />
                                        </div>
                                        <select 
                                            value={filterGame} 
                                            onChange={(e) => setFilterGame(e.target.value)}
                                            className="py-2 px-3 text-xs rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/20 text-zinc-900 dark:text-white outline-none cursor-pointer"
                                        >
                                            <option value="all">Todos los juegos</option>
                                            <option value="puzzle">Puzzle</option>
                                            <option value="trivia">Trivia</option>
                                            <option value="shura_run">Shura Run</option>
                                        </select>
                                    </>
                                )}
                                <button onClick={activeTab === 'scores' ? fetchScores : fetchMessages} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all border border-primary/20">
                                    <span className="material-symbols-outlined text-sm">refresh</span> REFRESH
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 dark:text-slate-400 bg-zinc-100 dark:bg-black/20 border-b border-zinc-200 dark:border-white/5">
                                        {activeTab === 'scores' ? (
                                            <>
                                                <th className="px-8 py-5">Player Identity</th>
                                                <th className="px-8 py-5">Game Zone</th>
                                                <th className="px-8 py-5">Score</th>
                                                <th className="px-8 py-5">Timestamp</th>
                                                <th className="px-8 py-5 text-right">Action</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-8 py-5">User Identity</th>
                                                <th className="px-8 py-5">Submission Message</th>
                                                <th className="px-8 py-5">Location</th>
                                                <th className="px-8 py-5">Timestamp</th>
                                                <th className="px-8 py-5 text-right">Action</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                                    {loading ? (
                                        <tr><td colSpan={5} className="px-8 py-10 text-center font-mono text-sm text-zinc-500 dark:text-slate-500 uppercase tracking-widest">Awaiting Data Streams...</td></tr>
                                    ) : activeTab === 'scores' ? (
                                        filteredScores.length === 0 ? (
                                            <tr><td colSpan={5} className="px-8 py-10 text-center font-mono text-sm text-zinc-500 dark:text-slate-500 uppercase tracking-widest">No Database Records Found.</td></tr>
                                        ) : (
                                            filteredScores.map(score => (
                                                <tr key={score.id} className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center font-display font-bold text-sm text-white border border-white/20 shadow-lg">
                                                                {score.player_name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                {editingId === score.id ? (
                                                                    <input type="text" value={editForm.player_name} onChange={(e) => setEditForm({...editForm, player_name: e.target.value})} className="bg-white dark:bg-black/50 border border-zinc-300 dark:border-white/20 rounded px-2 py-1 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary" />
                                                                ) : (
                                                                    <span className="block font-display font-black text-lg tracking-tight leading-none text-zinc-900 dark:text-white">{score.player_name}</span>
                                                                )}
                                                                <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">ID: #{score.id.substring(0, 5)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-primary border border-primary/30 bg-primary/5 px-2 py-1 rounded">
                                                            {score.game_type.replace('_', ' ')}
                                                        </span>
                                                        <div className="text-[10px] text-zinc-500 dark:text-slate-500 uppercase mt-2">
                                                            {editingId === score.id ? (
                                                                <input type="text" value={editForm.difficulty} onChange={(e) => setEditForm({...editForm, difficulty: e.target.value})} className="bg-white dark:bg-black/50 border border-zinc-300 dark:border-white/20 rounded px-1 py-0.5" />
                                                            ) : score.difficulty}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {editingId === score.id ? (
                                                            <input type="number" value={editForm.score} onChange={(e) => setEditForm({...editForm, score: e.target.value})} className="bg-white dark:bg-black/50 border border-zinc-300 dark:border-white/20 rounded px-2 py-1 flex w-24 text-zinc-900 dark:text-white focus:border-primary outline-none" />
                                                        ) : (
                                                            <span className={`text-xl font-black font-display ${score.score >= 1000 ? 'text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.3)]' : 'text-zinc-700 dark:text-slate-300'}`}>
                                                                {score.score.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-[11px] font-mono text-zinc-500 dark:text-slate-500 uppercase">{format(new Date(score.created_at), 'dd MMM yyyy')}</span>
                                                        <span className="block text-[10px] text-zinc-400 dark:text-slate-600 font-mono mt-1">{format(new Date(score.created_at), 'HH:mm:ss')}</span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        {editingId === score.id ? (
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={saveEdit} className="p-2 rounded-lg bg-[#39ff14]/10 text-[#39ff14] hover:bg-[#39ff14]/20"><FiSave /></button>
                                                                <button onClick={cancelEdit} className="p-2 rounded-lg bg-zinc-200 dark:bg-white/5 text-zinc-600 dark:text-slate-400 hover:bg-zinc-300 dark:hover:bg-white/10"><FiX /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-end gap-2 sm:opacity-20 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => startEdit(score)} className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-600 dark:text-slate-400 hover:text-[#00f2ff] transition-colors"><span className="material-symbols-outlined text-xl">edit</span></button>
                                                                <button onClick={() => handleDeleteScore(score.id)} className="p-2 rounded-lg hover:bg-primary/20 text-zinc-600 dark:text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-xl">delete</span></button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )
                                    ) : (
                                        messages.length === 0 ? (
                                            <tr><td colSpan={5} className="px-8 py-10 text-center font-mono text-sm text-zinc-500 dark:text-slate-500 uppercase tracking-widest">No Messages Found.</td></tr>
                                        ) : (
                                            messages.map(msg => (
                                                <tr key={msg.id} className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00f2ff] to-blue-600 flex items-center justify-center font-display font-bold text-sm text-white border border-white/20 shadow-lg">
                                                                {msg.username.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                {editingId === msg.id ? (
                                                                    <input type="text" value={editMessageForm.username} onChange={(e) => setEditMessageForm({...editMessageForm, username: e.target.value})} className="bg-white dark:bg-black/50 border border-zinc-300 dark:border-white/20 rounded px-2 py-1 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary" />
                                                                ) : (
                                                                    <span className="block font-display font-black text-lg tracking-tight leading-none text-zinc-900 dark:text-white">{msg.username}</span>
                                                                )}
                                                                <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">ID: #{msg.id.substring(0, 5)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2 text-sm max-w-xs">
                                                            {editingId === msg.id ? (
                                                                <textarea value={editMessageForm.text} onChange={(e) => setEditMessageForm({...editMessageForm, text: e.target.value})} className="w-full bg-white dark:bg-black/50 border border-zinc-300 dark:border-white/20 rounded px-2 py-1 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary" rows={2} />
                                                            ) : (
                                                                <span className="text-zinc-700 dark:text-slate-300 truncate">{msg.text}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {editingId === msg.id ? (
                                                            <input type="text" value={editMessageForm.country} onChange={(e) => setEditMessageForm({...editMessageForm, country: e.target.value})} className="w-20 bg-white dark:bg-black/50 border border-zinc-300 dark:border-white/20 rounded px-2 py-1 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary" />
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-zinc-700 dark:text-slate-300">{msg.country}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-[11px] font-mono text-zinc-500 dark:text-slate-500 uppercase">{msg.timestamp ? format(new Date(msg.timestamp), 'dd MMM yyyy') : '-'}</span>
                                                        <span className="block text-[10px] text-zinc-400 dark:text-slate-600 font-mono mt-1">{msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm:ss') : ''}</span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        {editingId === msg.id ? (
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={saveEditMessage} className="p-2 rounded-lg bg-[#39ff14]/10 text-[#39ff14] hover:bg-[#39ff14]/20"><FiSave /></button>
                                                                <button onClick={cancelEdit} className="p-2 rounded-lg bg-zinc-200 dark:bg-white/5 text-zinc-600 dark:text-slate-400 hover:bg-zinc-300 dark:hover:bg-white/10"><FiX /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-end gap-2 sm:opacity-20 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => startEditMessage(msg)} className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-600 dark:text-slate-400 hover:text-[#00f2ff] transition-colors"><span className="material-symbols-outlined text-xl">edit</span></button>
                                                                <button onClick={() => handleDeleteMessage(msg.id)} className="p-2 rounded-lg hover:bg-primary/20 text-zinc-600 dark:text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-xl">delete</span></button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-zinc-100/50 dark:bg-black/40 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between px-8">
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-slate-500 uppercase tracking-widest">
                                Displaying {activeTab === 'scores' ? filteredScores.length : messages.length} Records
                            </span>
                        </div>
                    </section>
                </div>

                {/* Right Side Panel */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <section className="glass-panel backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 rounded-3xl border border-zinc-200 dark:border-white/10 flex flex-col">
                        <div className="p-6 border-b border-zinc-200 dark:border-white/5">
                            <h3 className="font-display font-extrabold text-sm uppercase tracking-widest flex items-center gap-2 text-zinc-900 dark:text-white">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#FF1F8E]"></span>
                                Actividad Reciente
                            </h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex gap-4 relative">
                                <div className="absolute left-4 top-8 bottom-[-24px] w-[1px] bg-zinc-200 dark:bg-white/10"></div>
                                <div className="w-8 h-8 rounded-full bg-[#00f2ff]/10 dark:bg-[#00f2ff]/20 flex items-center justify-center flex-shrink-0 z-10 border border-[#00f2ff]/30">
                                    <span className="material-symbols-outlined text-[#00f2ff] text-sm">login</span>
                                </div>
                                <div className="flex-grow">
                                    <p className="text-xs font-semibold leading-tight text-zinc-800 dark:text-white"><span className="text-[#00f2ff]">Admin</span> logged in</p>
                                    <p className="text-[10px] text-zinc-400 dark:text-slate-500 mt-1 uppercase font-bold">Just now</p>
                                </div>
                            </div>
                            <div className="flex gap-4 relative">
                                <div className="absolute left-4 top-8 bottom-[-24px] w-[1px] bg-zinc-200 dark:bg-white/10"></div>
                                <div className="w-8 h-8 rounded-full bg-[#39ff14]/10 dark:bg-[#39ff14]/20 flex items-center justify-center flex-shrink-0 z-10 border border-[#39ff14]/30">
                                    <span className="material-symbols-outlined text-[#39ff14] text-sm">check_circle</span>
                                </div>
                                <div className="flex-grow">
                                    <p className="text-xs font-semibold leading-tight text-zinc-800 dark:text-white">System DB <span className="text-[#39ff14]">Synced</span></p>
                                    <p className="text-[10px] text-zinc-400 dark:text-slate-500 mt-1 uppercase font-bold">Auto-Task</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 z-10 border border-zinc-300 dark:border-white/10">
                                    <span className="material-symbols-outlined text-zinc-500 dark:text-slate-400 text-sm">history</span>
                                </div>
                                <div className="flex-grow">
                                    <p className="text-xs font-semibold leading-tight text-zinc-800 dark:text-white">Scores Refreshed</p>
                                    <p className="text-[10px] text-zinc-400 dark:text-slate-500 mt-1 uppercase font-bold">Local client</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="glass-panel backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 rounded-3xl border border-zinc-200 dark:border-white/10 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 dark:text-slate-400 uppercase">Hardware Load</h3>
                            <div className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_8px_rgba(0,242,255,0.6)]"></div>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-bold text-zinc-500 dark:text-slate-400 uppercase tracking-widest">CPU Usage</span>
                                    <span className="text-xs font-mono font-bold text-[#00f2ff]">24%</span>
                                </div>
                                <div className="h-1 bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-[#00f2ff] to-blue-500 w-[24%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-bold text-zinc-500 dark:text-slate-400 uppercase tracking-widest">Memory</span>
                                    <span className="text-xs font-mono font-bold text-primary">62%</span>
                                </div>
                                <div className="h-1 bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary to-purple-500 w-[62%]"></div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-around">
                                <div className="text-center">
                                    <p className="text-[10px] text-zinc-400 dark:text-slate-500 font-bold uppercase mb-1">Ping</p>
                                    <p className="text-sm font-mono font-bold text-zinc-800 dark:text-white">14ms</p>
                                </div>
                                <div className="w-[1px] h-8 bg-zinc-200 dark:bg-white/5"></div>
                                <div className="text-center">
                                    <p className="text-[10px] text-zinc-400 dark:text-slate-500 font-bold uppercase mb-1">Loss</p>
                                    <p className="text-sm font-mono font-bold text-zinc-800 dark:text-white">0.0%</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
