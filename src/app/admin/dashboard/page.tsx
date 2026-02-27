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
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <form onSubmit={handleLogin} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-center mb-6 text-primary-pink">
                        <FiLock size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">Admin Access</h2>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Contraseña Maestra"
                        className="w-full p-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-transparent mb-4 focus:border-primary-pink outline-none transition-colors"
                    />
                    <button type="submit" className="w-full bg-primary-pink text-white font-bold py-3 rounded-xl hover:bg-pink-600 transition-colors">
                        Ingresar
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                    <h1 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">
                        Admin <span className="text-primary-pink">Dashboard</span>
                    </h1>
                    <button onClick={handleLogout} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-bold text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                        Cerrar Sesión
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    <button 
                        onClick={() => setActiveTab('scores')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'scores' ? 'bg-primary-blue text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-500'}`}
                    >
                        🎮 Puntajes
                    </button>
                    <button 
                        onClick={() => setActiveTab('messages')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'messages' ? 'bg-primary-pink text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-500'}`}
                    >
                        💬 Mensajes (Próximamente)
                    </button>
                </div>

                {activeTab === 'scores' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        {/* Filters */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative w-full md:w-64">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar jugador..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-blue outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <FiFilter className="text-gray-400" />
                                    <select 
                                        value={filterGame} 
                                        onChange={(e) => setFilterGame(e.target.value)}
                                        className="py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none cursor-pointer"
                                    >
                                        <option value="all">Todos los juegos</option>
                                        <option value="puzzle">Puzzle</option>
                                        <option value="trivia">Trivia</option>
                                        <option value="shura_run">Shura Run</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={fetchScores} className="text-primary-blue hover:underline text-sm font-bold">
                                ↻ Refrescar
                            </button>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider font-bold">
                                        <th className="p-4 border-b border-gray-200 dark:border-gray-700">Jugador</th>
                                        <th className="p-4 border-b border-gray-200 dark:border-gray-700">Juego</th>
                                        <th className="p-4 border-b border-gray-200 dark:border-gray-700">Puntaje</th>
                                        <th className="p-4 border-b border-gray-200 dark:border-gray-700">Dificultad/Modo</th>
                                        <th className="p-4 border-b border-gray-200 dark:border-gray-700">Fecha</th>
                                        <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {loading ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">Cargando datos...</td></tr>
                                    ) : filteredScores.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">No se encontraron registros</td></tr>
                                    ) : (
                                        filteredScores.map((score) => (
                                            <tr key={score.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                                <td className="p-4 font-medium text-gray-900 dark:text-white">
                                                    {editingId === score.id ? (
                                                        <input 
                                                            type="text" 
                                                            value={editForm.player_name}
                                                            onChange={(e) => setEditForm({...editForm, player_name: e.target.value})}
                                                            className="w-full p-1 border rounded bg-white dark:bg-gray-800"
                                                        />
                                                    ) : score.player_name}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                                        ${score.game_type === 'puzzle' ? 'bg-purple-100 text-purple-600' : 
                                                          score.game_type === 'trivia' ? 'bg-blue-100 text-blue-600' : 
                                                          'bg-orange-100 text-orange-600'}`}>
                                                        {score.game_type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-mono">
                                                    {editingId === score.id ? (
                                                        <input 
                                                            type="number" 
                                                            value={editForm.score}
                                                            onChange={(e) => setEditForm({...editForm, score: e.target.value})}
                                                            className="w-20 p-1 border rounded bg-white dark:bg-gray-800"
                                                        />
                                                    ) : score.score}
                                                </td>
                                                <td className="p-4 text-sm text-gray-500">
                                                    {editingId === score.id ? (
                                                        <input 
                                                            type="text" 
                                                            value={editForm.difficulty || ''}
                                                            onChange={(e) => setEditForm({...editForm, difficulty: e.target.value})}
                                                            className="w-full p-1 border rounded bg-white dark:bg-gray-800"
                                                        />
                                                    ) : (
                                                        <>
                                                            {score.difficulty} 
                                                            {score.metadata?.mode && <span className="text-xs ml-1 opacity-70">({score.metadata.mode})</span>}
                                                        </>
                                                    )}
                                                </td>
                                                <td className="p-4 text-xs text-gray-400">
                                                    {format(new Date(score.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {editingId === score.id ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={saveEdit} className="p-2 text-green-500 hover:bg-green-100 rounded-full"><FiSave /></button>
                                                            <button onClick={cancelEdit} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><FiX /></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEdit(score)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-full" title="Editar"><FiEdit2 /></button>
                                                            <button onClick={() => handleDeleteScore(score.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Eliminar"><FiTrash2 /></button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'messages' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                         <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="text-xl font-bold">Muro de la Fama</h3>
                            <button onClick={fetchMessages} className="text-primary-pink hover:underline text-sm font-bold">
                                ↻ Refrescar
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider font-bold">
                                        <th className="p-4 border-b border-gray-200 dark:border-gray-700">Usuario</th>
                                        <th className="p-4 border-b border-gray-200 dark:border-gray-700">Mensaje</th>
                                        <th className="p-4 border-b border-gray-200 dark:border-gray-700">País</th>
                                        <th className="p-4 border-b border-gray-200 dark:border-gray-700">Fecha</th>
                                        <th className="p-4 border-b border-gray-200 dark:border-gray-700 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {messages.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay mensajes aún</td></tr>
                                    ) : (
                                        messages.map((msg) => (
                                            <tr key={msg.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                                <td className="p-4 font-bold text-gray-900 dark:text-white">
                                                    {editingId === msg.id ? (
                                                        <input 
                                                            type="text" 
                                                            value={editMessageForm.username}
                                                            onChange={(e) => setEditMessageForm({...editMessageForm, username: e.target.value})}
                                                            className="w-full p-1 border rounded bg-white dark:bg-gray-800"
                                                        />
                                                    ) : msg.username}
                                                </td>
                                                <td className="p-4 max-w-xs truncate">
                                                    {editingId === msg.id ? (
                                                        <textarea 
                                                            value={editMessageForm.text}
                                                            onChange={(e) => setEditMessageForm({...editMessageForm, text: e.target.value})}
                                                            className="w-full p-1 border rounded bg-white dark:bg-gray-800"
                                                            rows={2}
                                                        />
                                                    ) : msg.text}
                                                </td>
                                                <td className="p-4">
                                                    {editingId === msg.id ? (
                                                        <input 
                                                            type="text" 
                                                            value={editMessageForm.country}
                                                            onChange={(e) => setEditMessageForm({...editMessageForm, country: e.target.value})}
                                                            className="w-20 p-1 border rounded bg-white dark:bg-gray-800"
                                                        />
                                                    ) : (
                                                        <span className="flex items-center gap-2">
                                                            <span>{msg.country}</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-xs text-gray-400">
                                                    {msg.timestamp ? format(new Date(msg.timestamp), 'dd MMM yyyy, HH:mm', { locale: es }) : '-'}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {editingId === msg.id ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={saveEditMessage} className="p-2 text-green-500 hover:bg-green-100 rounded-full"><FiSave /></button>
                                                            <button onClick={cancelEdit} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><FiX /></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEditMessage(msg)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-full" title="Editar"><FiEdit2 /></button>
                                                            <button onClick={() => handleDeleteMessage(msg.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Eliminar"><FiTrash2 /></button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
