'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { getAllWallMessages, deleteWallMessage, updateWallMessage } from '../../../utils/firebase';
import { FiTrash2, FiEdit2, FiSave, FiX, FiFilter, FiSearch, FiLock } from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MdBolt, MdDelete, MdDns, MdEdit, MdForum, MdGroups, MdLogout, MdMonitor, MdRefresh, MdSensors, MdShield, MdSportsEsports, MdLogin, MdSync } from 'react-icons/md';

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
    const [hardwareStats, setHardwareStats] = useState({
        cpu: 24,
        memory: 62,
        ping: 14,
        loss: 0.0
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

    // Activity Logger
    const logActivity = (action: string, detail: string, type: 'auth' | 'sync' | 'refresh' | 'edit' | 'delete') => {
        const newActivity = {
            id: Date.now(),
            action,
            detail,
            type,
            timestamp: new Date().toISOString()
        };
        const updatedActivity = [newActivity, ...recentActivity].slice(0, 10);
        setRecentActivity(updatedActivity);
        localStorage.setItem('admin_activity', JSON.stringify(updatedActivity));
    };

    // Auth Check
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            localStorage.setItem('admin_auth', 'true');
            logActivity('Admin', 'logged in', 'auth');
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

        // Load Activity
        const savedActivity = localStorage.getItem('admin_activity');
        if (savedActivity) {
            setRecentActivity(JSON.parse(savedActivity));
        } else {
            // Default initial activities
            const initial = [
                { id: 1, action: 'Admin', detail: 'logged in', type: 'auth', timestamp: new Date().toISOString() },
                { id: 2, action: 'System DB', detail: 'Synced', type: 'sync', timestamp: new Date().toISOString() }
            ];
            setRecentActivity(initial);
        }

        // Random Hardware Stats
        setHardwareStats({
            cpu: Math.floor(Math.random() * (40 - 15 + 1)) + 15,
            memory: Math.floor(Math.random() * (75 - 45 + 1)) + 45,
            ping: Math.floor(Math.random() * (45 - 12 + 1)) + 12,
            loss: parseFloat((Math.random() * 0.5).toFixed(1))
        });
    }, []);

    // Messages Fetching
    const fetchMessages = async () => {
        const msgs = await getAllWallMessages();
        setMessages(msgs);
        logActivity('Messages', 'Refreshed', 'refresh');
    };

    // Message CRUD
    const handleDeleteMessage = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este mensaje?')) return;

        const result = await deleteWallMessage(id);
        if (result.success) {
            setMessages(messages.filter(m => m.id !== id));
            logActivity('Message', `Deleted (#${id.substring(0, 5)})`, 'delete');
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
            logActivity('Message', `Updated (#${editingId?.substring(0, 5)})`, 'edit');
            setEditingId(null);
        } else {
            alert('Error al actualizar mensaje');
        }
    };

    const handleLogout = () => {
        logActivity('Admin', 'logged out', 'auth');
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
        else {
            setScores(data || []);
            logActivity('Scores', 'Refreshed', 'refresh');
        }
        setLoading(false);
    };

    const handleDeleteScore = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este puntaje?')) return;

        const { error } = await supabase
            .from('game_scores')
            .delete()
            .eq('id', id);

        if (error) alert('Error al eliminar');
        else {
            setScores(scores.filter(s => s.id !== id));
            logActivity('Score', `Deleted (#${id.substring(0, 5)})`, 'delete');
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
            logActivity('Score', `Updated (#${editingId?.substring(0, 5)})`, 'edit');
            setEditingId(null);
        }
    };

    const filteredScores = scores.filter(score => {
        const matchesGame = filterGame === 'all' || score.game_type === filterGame;
        const matchesSearch = score.player_name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesGame && matchesSearch;
    });

    if (!isAuthenticated) {
        return (
            // CAMBIO: Fondo principal ligeramente más oscuro en light mode para contraste (bg-zinc-50)
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-background-dark p-6 transition-colors duration-300 relative overflow-hidden">
                {/* Fondo de rejilla ciberpunk adaptado para light mode */}
                <div className="absolute inset-0 cyber-grid-bg bg-[radial-gradient(circle,rgba(255,31,142,0.1)_1px,transparent_1px)] dark:bg-[radial-gradient(circle,rgba(255,31,142,0.08)_1px,transparent_1px)] opacity-60 dark:opacity-30 pointer-events-none data-grid-bg"></div>

                {/* CAMBIO: Panel de login con fondo blanco sólido en light mode (bg-white), bordes más oscuros y sombra pronunciada */}
                <form onSubmit={handleLogin} className="relative z-10 glass-panel bg-white dark:bg-slate-900/40 p-10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-2xl w-full max-w-md border border-zinc-200 dark:border-white/10 backdrop-blur-xl">
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center rotate-3 shadow-[0_0_20px_rgba(255,31,142,0.4)]">
                            <MdMonitor className="text-purple-500" />
                        </div>
                    </div>
                    {/* CAMBIO: Texto del logo forzado a zinc-950 en light mode */}
                    <h2 className="text-3xl font-display font-black text-center mb-2 tracking-tighter text-zinc-950 dark:text-white uppercase italic">
                        DASH-<span className="text-primary glow-text">BOARD</span>
                    </h2>
                    <p className="text-center text-xs font-bold text-zinc-600 dark:text-slate-400 tracking-[0.2em] mb-8 uppercase">
                        Admin Access Protocol
                    </p>
                    <div className="space-y-6">
                        <div className="relative">
                            {/* CAMBIO: Icono de candado más oscuro en light mode (text-zinc-500) */}
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-slate-500" size={20} />
                            {/* CAMBIO: Input con fondo zinc-100, borde zinc-300 y texto zinc-950 en light mode */}
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Master Password"
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-100 dark:bg-black/50 text-zinc-950 dark:text-white placeholder-zinc-500 dark:placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none"
                            />
                        </div>
                        <button type="submit" className="w-full bg-primary hover:bg-primary-dark font-black tracking-widest text-sm py-4 rounded-xl transition-all shadow-[0_10px_20px_-5px_rgba(255,31,142,0.4),0_0_15px_rgba(255,31,142,0.2)] 
  dark:shadow-[0_0_15px_rgba(255,31,142,0.3)] 
  hover:shadow-[0_20px_25px_-5px_rgba(255,31,142,0.5)] 
  dark:hover:shadow-[0_0_25px_rgba(255,31,142,0.5)] 
  border border-primary/70 dark:border-primary/50 
  uppercase transform hover:-translate-y-1 active:scale-[0.98]"
                        >
                            Authenticate
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        // CAMBIO: Fondo principal del dashboard zinc-50 en light mode y texto zinc-900 por defecto
        <div className="bg-zinc-50 dark:bg-background-dark text-zinc-900 dark:text-slate-100 font-sans min-h-screen selection:bg-primary selection:text-white overflow-x-hidden transition-colors duration-300 relative">
            {/* Fondo de rejilla adaptado */}
            <div className="fixed inset-0 cyber-grid-bg bg-[radial-gradient(circle,rgba(255,31,142,0.08)_1px,transparent_1px)] opacity-40 dark:opacity-30 pointer-events-none"></div>

            {/* Elipses de fondo con opacidad reducida en light mode para no ensuciar */}
            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 dark:bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#00f2ff]/3 dark:bg-[#00f2ff]/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

            {/* CAMBIO: Header con borde zinc-200 y fondo blanco sólido/glass en light mode */}
            <header className="sticky top-0 z-50 glass-panel backdrop-blur-xl bg-white/95 dark:bg-slate-950/60 border-b border-zinc-200 dark:border-white/5 transition-colors duration-300">
                <div className="max-w-[1800px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform shadow-[0_0_15px_rgba(255,31,142,0.4)]">
                                <MdBolt className="text-2xl" />
                            </div>
                            {/* CAMBIO: Texto del logo zinc-950 en light mode */}
                            <span className="font-display font-extrabold text-2xl tracking-tighter uppercase italic text-zinc-950 dark:text-white">
                                DASH-<span className="text-primary glow-text">BOARD</span>
                            </span>
                        </div>
                        <nav className="hidden xl:flex items-center gap-8">
                            {/* CAMBIO: Texto de navegación inactivo zinc-600 en light mode */}
                            <button onClick={() => setActiveTab('scores')} className={`flex items-center gap-2 text-[11px] font-bold tracking-widest transition-opacity ${activeTab === 'scores' ? 'text-primary border-b-2 border-primary pb-1' : 'text-zinc-600 dark:text-slate-300 opacity-70 hover:opacity-100'}`}>
                                <MdSportsEsports className="text-[18px]" /> PUNTAJES
                            </button>
                            <button onClick={() => setActiveTab('messages')} className={`flex items-center gap-2 text-[11px] font-bold tracking-widest transition-opacity ${activeTab === 'messages' ? 'text-primary border-b-2 border-primary pb-1' : 'text-zinc-600 dark:text-slate-300 opacity-70 hover:opacity-100'}`}>
                                <MdForum className="text-[18px]" /> MENSAJES
                            </button>
                        </nav>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* CAMBIO: Tag 'Live System' con fondo zinc-100 y borde zinc-200 en light mode */}
                        <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#FF0000] animate-pulse"></div>
                                <span className="text-[10px] font-bold text-[#FF0000] tracking-widest uppercase">Live System</span>
                            </div>
                            <div className="h-4 w-[1px] bg-zinc-300 dark:bg-white/10"></div>
                            {/* CAMBIO: Texto secundario zinc-600 en light mode */}
                            <span className="text-[10px] font-mono text-zinc-600 dark:text-slate-400 uppercase">Nodes: 14 Active</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                {/* CAMBIO: Nombre de usuario zinc-950, rol zinc-600 en light mode */}
                                <p className="text-xs font-bold text-zinc-950 dark:text-white">Admin_User</p>
                                <p className="text-[10px] text-zinc-600 dark:text-slate-400">Super Administrator</p>
                            </div>
                            {/* CAMBIO: Contenedor de avatar zinc-200 en light mode */}
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
                    {/* CAMBIO: Sidebar con fondo blanco sólido, borde zinc-200 y sombra suave en light mode */}
                    <div className="glass-panel backdrop-blur-xl bg-white dark:bg-slate-900/40 border border-zinc-200 dark:border-white/10 p-3 rounded-2xl flex flex-row lg:flex-col items-center justify-around lg:justify-start gap-4 lg:min-h-[600px] shadow-sm dark:shadow-none">
                        {/* CAMBIO: Botones inactivos zinc-500, hover zinc-100 bg en light mode */}
                        <button onClick={() => setActiveTab('scores')} className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeTab === 'scores' ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(255,31,142,0.2)]' : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-slate-400 hover:text-zinc-950 dark:hover:text-white'}`}>
                            <MdSportsEsports />
                        </button>
                        <button onClick={() => setActiveTab('messages')} className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeTab === 'messages' ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(255,31,142,0.2)]' : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-slate-400 hover:text-zinc-950 dark:hover:text-white'}`}>
                            <MdForum />
                        </button>
                        <button className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-slate-400 hover:text-zinc-950 dark:hover:text-white transition-all">
                            <MdMonitor />
                        </button>
                        <button className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-slate-400 hover:text-zinc-950 dark:hover:text-white transition-all">
                            <MdShield />
                        </button>
                        <div className="flex-grow lg:block hidden"></div>
                        <button onClick={handleLogout} className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-slate-400 hover:text-red-600 transition-all">
                            <MdLogout />
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                    {/* Top Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* CAMBIO: Cards con fondo blanco sólido, borde zinc-200 y sombra suave en light mode */}
                        <div className="glass-panel backdrop-blur-xl bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-primary/30 shadow-[0_10px_30px_-10px_rgba(255,31,142,0.1)] dark:shadow-[0_0_15px_rgba(255,31,142,0.1)] relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Total Records</span>
                                <MdGroups className="text-primary/60 dark:text-primary/40" />
                            </div>
                            <div className="flex items-end gap-2 relative z-10">
                                {/* CAMBIO: Texto principal zinc-950 en light mode */}
                                <h3 className="text-4xl font-display font-black text-zinc-950 dark:text-white">{activeTab === 'scores' ? scores.length : messages.length}</h3>
                                <span className="text-xs text-[#39ff14] mb-1 font-bold">+Live</span>
                            </div>
                        </div>
                        <div className="glass-panel backdrop-blur-xl bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-[10px] font-bold tracking-widest text-[#00c2cc] dark:text-[#00f2ff] uppercase">Active Sessions</span>
                                <MdSensors className="text-[#00c2cc]/60 dark:text-[#00f2ff]/40" />
                            </div>
                            <div className="flex items-end gap-2">
                                <h3 className="text-4xl font-display font-black text-zinc-950 dark:text-white">1,204</h3>
                                <span className="text-xs text-[#00c2cc] dark:text-[#00f2ff] mb-1 font-bold">Online</span>
                            </div>
                        </div>
                        <div className="glass-panel backdrop-blur-xl bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-6">
                                {/* CAMBIO: Texto de categoría zinc-600 en light mode */}
                                <span className="text-[10px] font-bold tracking-widest text-zinc-600 dark:text-slate-400 uppercase">Server Uptime</span>
                                <MdDns className="text-zinc-500 dark:text-slate-400/40" />
                            </div>
                            <div className="flex items-end gap-2">
                                <h3 className="text-4xl font-display font-black text-zinc-950 dark:text-white">99.9<span className="text-sm opacity-50">%</span></h3>
                                {/* CAMBIO: Texto secundario zinc-600 en light mode */}
                                <span className="text-xs text-zinc-600 dark:text-slate-400 mb-1 font-mono">24d 5h</span>
                            </div>
                        </div>
                    </div>

                    {/* Data Table Section */}
                    {/* CAMBIO: Sección de tabla con fondo blanco sólido y sombra pronunciada en light mode */}
                    <section className="glass-panel backdrop-blur-xl bg-white dark:bg-slate-900/60 rounded-3xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.08)] dark:shadow-2xl flex flex-col transition-shadow duration-300">
                        {/* CAMBIO: Header de la tabla zinc-100 bg, borde zinc-200 en light mode */}
                        <div className="p-6 border-b border-zinc-200 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-zinc-100 dark:bg-white/5 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-8 bg-primary rounded-full"></div>
                                <div>
                                    {/* CAMBIO: Titulo zinc-950 en light mode */}
                                    <h2 className="font-display font-extrabold text-xl tracking-tight uppercase text-zinc-950 dark:text-white">
                                        {activeTab === 'scores' ? 'Puntajes Globales' : 'Muro de la Fama'}
                                    </h2>
                                    {/* CAMBIO: Subtitulo zinc-600 en light mode */}
                                    <p className="text-[10px] font-bold text-zinc-600 dark:text-slate-400 uppercase tracking-[0.2em]">Live Database Records</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {activeTab === 'scores' && (
                                    <>
                                        <div className="relative">
                                            {/* CAMBIO: Icono búsqueda zinc-500 en light mode */}
                                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
                                            {/* CAMBIO: Input búsqueda zinc-50 bg, borde zinc-300, texto zinc-950 en light mode */}
                                            <input
                                                type="text"
                                                placeholder="Buscar jugador..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full sm:w-48 pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/20 text-zinc-950 dark:text-white focus:border-primary outline-none transition-colors placeholder-zinc-500 dark:placeholder-zinc-400"
                                            />
                                        </div>
                                        {/* CAMBIO: Select zinc-50 bg, borde zinc-300, texto zinc-950 en light mode */}
                                        <select
                                            value={filterGame}
                                            onChange={(e) => setFilterGame(e.target.value)}
                                            className="py-2 px-3 text-xs rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/20 text-zinc-950 dark:text-white outline-none cursor-pointer focus:border-primary transition-colors"
                                        >
                                            <option value="all">Todos los juegos</option>
                                            <option value="puzzle">Puzzle</option>
                                            <option value="trivia">Trivia</option>
                                            <option value="shura_run">Shura Run</option>
                                        </select>
                                    </>
                                )}
                                <button onClick={activeTab === 'scores' ? fetchScores : fetchMessages} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all border border-primary/20">
                                    <MdRefresh className="text-sm" /> REFRESH
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    {/* CAMBIO: Th de la tabla zinc-50 bg, borde zinc-200, texto zinc-600 en light mode */}
                                    <tr className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-600 dark:text-slate-400 bg-zinc-50 dark:bg-black/20 border-b border-zinc-200 dark:border-white/5">
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
                                {/* CAMBIO: Divide-y zinc-200 en light mode */}
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
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center font-display font-bold text-sm dark:text-white border border-white/20 shadow-lg relative z-10">
                                                                {score.player_name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                {editingId === score.id ? (
                                                                    <input type="text" value={editForm.player_name} onChange={(e) => setEditForm({ ...editForm, player_name: e.target.value })} className="bg-zinc-50 dark:bg-black/50 border border-zinc-300 dark:border-white/20 rounded px-2 py-1 text-sm text-zinc-950 dark:text-white outline-none focus:border-primary transition-colors" />
                                                                ) : (
                                                                    <span className="block font-display font-black text-lg tracking-tight leading-none text-zinc-950 dark:text-white">{score.player_name}</span>
                                                                )}
                                                                <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1 relative z-10">ID: #{score.id.substring(0, 5)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-primary border border-primary/30 bg-primary/5 px-2 py-1 rounded">
                                                            {score.game_type.replace('_', ' ')}
                                                        </span>
                                                        <div className="text-[10px] text-zinc-500 dark:text-slate-500 uppercase mt-2">
                                                            {editingId === score.id ? (
                                                                <input type="text" value={editForm.difficulty} onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })} className="bg-zinc-50 dark:bg-black/50 border border-zinc-300 dark:border-white/20 rounded px-1 py-0.5 text-zinc-950 dark:text-white" />
                                                            ) : score.difficulty}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {editingId === score.id ? (
                                                            <input type="number" value={editForm.score} onChange={(e) => setEditForm({ ...editForm, score: e.target.value })} className="bg-zinc-50 dark:bg-black/50 border border-zinc-300 dark:border-white/20 rounded px-2 py-1 flex w-24 text-zinc-950 dark:text-white focus:border-primary outline-none transition-colors" />
                                                        ) : (
                                                            <span className={`text-xl font-black font-display ${score.score >= 1000 ? 'text-[#00a8b3] dark:text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,168,179,0.2)] dark:drop-shadow-[0_0_8px_rgba(0,242,255,0.3)]' : 'text-zinc-800 dark:text-slate-300'}`}>
                                                                {score.score.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-[11px] font-mono text-zinc-600 dark:text-slate-500 uppercase">{format(new Date(score.created_at), 'dd MMM yyyy')}</span>
                                                        <span className="block text-[10px] text-zinc-500 dark:text-slate-600 font-mono mt-1">{format(new Date(score.created_at), 'HH:mm:ss')}</span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right relative z-10">
                                                        {editingId === score.id ? (
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={saveEdit} className="p-2 rounded-lg bg-[#39ff14]/10 text-[#2db30e] dark:text-[#39ff14] hover:bg-[#39ff14]/20 transition-colors"><FiSave /></button>
                                                                <button onClick={cancelEdit} className="p-2 rounded-lg bg-zinc-200 dark:bg-white/5 text-zinc-600 dark:text-slate-400 hover:bg-zinc-300 dark:hover:bg-white/10 transition-colors"><FiX /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-end gap-2 sm:opacity-40 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => startEdit(score)} className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-600 dark:text-slate-400 hover:text-[#00a8b3] dark:hover:text-[#00f2ff] transition-colors"><MdEdit className="text-xl" /></button>
                                                                <button onClick={() => handleDeleteScore(score.id)} className="p-2 rounded-lg hover:bg-primary/20 text-zinc-600 dark:text-slate-400 hover:text-primary transition-colors"><MdDelete className="text-xl" /></button>
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
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00c2cc] dark:from-[#00f2ff] to-blue-600 flex items-center justify-center font-display font-bold text-sm text-white border border-white/20 shadow-lg relative z-10">
                                                                {msg.username.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                {editingId === msg.id ? (
                                                                    <input type="text" value={editMessageForm.username} onChange={(e) => setEditMessageForm({ ...editMessageForm, username: e.target.value })} className="bg-zinc-50 dark:bg-black/50 border border-zinc-300 dark:border-white/20 rounded px-2 py-1 text-sm text-zinc-950 dark:text-white outline-none focus:border-primary transition-colors" />
                                                                ) : (
                                                                    <span className="block font-display font-black text-lg tracking-tight leading-none text-zinc-950 dark:text-white">{msg.username}</span>
                                                                )}
                                                                <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1 relative z-10">ID: #{msg.id.substring(0, 5)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2 text-sm max-w-xs relative z-10">
                                                            {editingId === msg.id ? (
                                                                <textarea value={editMessageForm.text} onChange={(e) => setEditMessageForm({ ...editMessageForm, text: e.target.value })} className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-300 dark:border-white/20 rounded px-2 py-1 text-sm text-zinc-950 dark:text-white outline-none focus:border-primary transition-colors" rows={2} />
                                                            ) : (
                                                                <span className="text-zinc-800 dark:text-slate-300 truncate">{msg.text}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {editingId === msg.id ? (
                                                            <input type="text" value={editMessageForm.country} onChange={(e) => setEditMessageForm({ ...editMessageForm, country: e.target.value })} className="w-20 bg-zinc-50 dark:bg-black/50 border border-zinc-300 dark:border-white/20 rounded px-2 py-1 text-sm text-zinc-950 dark:text-white outline-none focus:border-primary transition-colors" />
                                                        ) : (
                                                            <div className="flex items-center gap-2 relative z-10">
                                                                <span className="text-xs font-bold text-zinc-800 dark:text-slate-300">{msg.country}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-[11px] font-mono text-zinc-600 dark:text-slate-500 uppercase">{msg.timestamp ? format(new Date(msg.timestamp), 'dd MMM yyyy') : '-'}</span>
                                                        <span className="block text-[10px] text-zinc-500 dark:text-slate-600 font-mono mt-1">{msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm:ss') : ''}</span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right relative z-10">
                                                        {editingId === msg.id ? (
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={saveEditMessage} className="p-2 rounded-lg bg-[#39ff14]/10 text-[#2db30e] dark:text-[#39ff14] hover:bg-[#39ff14]/20 transition-colors"><FiSave /></button>
                                                                <button onClick={cancelEdit} className="p-2 rounded-lg bg-zinc-200 dark:bg-white/5 text-zinc-600 dark:text-slate-400 hover:bg-zinc-300 dark:hover:bg-white/10 transition-colors"><FiX /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-end gap-2 sm:opacity-40 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => startEditMessage(msg)} className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-600 dark:text-slate-400 hover:text-[#00c2cc] dark:hover:text-[#00f2ff] transition-colors"><MdEdit className="text-xl" /></button>
                                                                <button onClick={() => handleDeleteMessage(msg.id)} className="p-2 rounded-lg hover:bg-primary/20 text-zinc-600 dark:text-slate-400 hover:text-primary transition-colors"><MdDelete className="text-xl" /></button>
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
                        {/* CAMBIO: Footer tabla zinc-100/50 bg, borde zinc-200, texto zinc-500 en light mode */}
                        <div className="p-4 bg-zinc-100/50 dark:bg-black/40 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between px-8 mt-auto relative z-10">
                            <span className="text-[10px] font-bold text-zinc-500 dark:text-slate-500 uppercase tracking-widest">
                                Displaying {activeTab === 'scores' ? filteredScores.length : messages.length} Records
                            </span>
                        </div>
                    </section>
                </div>

                {/* Right Side Panel */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    {/* CAMBIO: Panel actividad con fondo blanco sólido y sombra suave en light mode */}
                    <section className="glass-panel backdrop-blur-xl bg-white dark:bg-slate-900/40 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col transition-shadow duration-300">
                        <div className="p-6 border-b border-zinc-200 dark:border-white/5">
                            {/* CAMBIO: Titulo zinc-950 en light mode */}
                            <h3 className="font-display font-extrabold text-sm uppercase tracking-widest flex items-center gap-2 text-zinc-950 dark:text-white">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#FF1F8E]"></span>
                                Actividad Reciente
                            </h3>
                        </div>
                        <div className="p-6 space-y-6 flex-grow">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex gap-4 relative">
                                    {/* CAMBIO: Icono actividad borde primary/30 en light mode */}
                                    <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-white/5 flex items-center justify-center flex-shrink-0 z-10 border border-primary/30 dark:border-primary/20 transition-colors duration-300">
                                        {activity.type === 'auth' ? <MdLogin className="text-primary text-sm" /> :
                                            activity.type === 'sync' ? <MdSync className="text-primary text-sm" /> :
                                                activity.type === 'refresh' ? <MdRefresh className="text-primary text-sm" /> :
                                                    activity.type === 'edit' ? <MdEdit className="text-primary text-sm" /> :
                                                        <MdDelete className="text-primary text-sm" />}
                                    </div>
                                    <div className="flex-grow">
                                        {/* CAMBIO: Texto actividad zinc-900 en light mode */}
                                        <p className="text-xs font-semibold leading-tight text-zinc-900 dark:text-white">
                                            <span className="text-primary">{activity.action}</span> {activity.detail}
                                        </p>
                                        {/* CAMBIO: Timestamp zinc-500 en light mode */}
                                        <p className="text-[10px] text-zinc-500 dark:text-slate-500 mt-1 uppercase font-bold relative z-10">
                                            {format(new Date(activity.timestamp), "HH:mm:ss 'HRS'")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* CAMBIO: Panel Hardware con fondo blanco sólido y sombra suave en light mode */}
                    <section className="glass-panel backdrop-blur-xl bg-white dark:bg-slate-900/40 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none p-6 transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-6">
                            {/* CAMBIO: Subtitulo zinc-600 en light mode */}
                            <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-600 dark:text-slate-400 uppercase">Hardware Load</h3>
                            {/* CAMBIO: Pulso cian (#00c2cc) en light mode */}
                            <div className="w-2 h-2 rounded-full bg-[#00c2cc] dark:bg-[#00f2ff] animate-pulse shadow-[0_0_8px_rgba(0,194,204,0.7)] dark:shadow-[0_0_8px_rgba(0,242,255,0.6)]"></div>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between items-end mb-2 relative z-10">
                                    {/* CAMBIO: Label zinc-600 en light mode */}
                                    <span className="text-[10px] font-bold text-zinc-600 dark:text-slate-400 uppercase tracking-widest">CPU Usage</span>
                                    {/* CAMBIO: Valor cian (#00a8b3) en light mode */}
                                    <span className="text-xs font-mono font-bold text-[#00a8b3] dark:text-[#00f2ff]">{hardwareStats.cpu}%</span>
                                </div>
                                {/* CAMBIO: Rail barra progreso zinc-200 en light mode */}
                                <div className="h-1 bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden">
                                    {/* CAMBIO: Barra progreso de cian claro (#00c2cc) a azul en light mode */}
                                    <div className="h-full bg-gradient-to-r from-[#00c2cc] dark:from-[#00f2ff] to-blue-500 transition-all duration-1000" style={{ width: `${hardwareStats.cpu}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-end mb-2 relative z-10">
                                    <span className="text-[10px] font-bold text-zinc-600 dark:text-slate-400 uppercase tracking-widest">Memory</span>
                                    <span className="text-xs font-mono font-bold text-primary">{hardwareStats.memory}%</span>
                                </div>
                                <div className="h-1 bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-1000" style={{ width: `${hardwareStats.memory}%` }}></div>
                                </div>
                            </div>
                            {/* CAMBIO: Separador zinc-200 en light mode */}
                            <div className="pt-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-around relative z-10">
                                <div className="text-center">
                                    {/* CAMBIO: Label zinc-500, valor zinc-900 en light mode */}
                                    <p className="text-[10px] text-zinc-500 dark:text-slate-500 font-bold uppercase mb-1">Ping</p>
                                    <p className="text-sm font-mono font-bold text-zinc-900 dark:text-white">{hardwareStats.ping}ms</p>
                                </div>
                                {/* CAMBIO: Separador vertical zinc-200 en light mode */}
                                <div className="w-[1px] h-8 bg-zinc-200 dark:bg-white/5"></div>
                                <div className="text-center">
                                    <p className="text-[10px] text-zinc-500 dark:text-slate-500 font-bold uppercase mb-1">Loss</p>
                                    <p className="text-sm font-mono font-bold text-zinc-900 dark:text-white">{hardwareStats.loss}%</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}