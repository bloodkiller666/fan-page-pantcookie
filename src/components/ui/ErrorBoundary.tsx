'use client';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center p-4 font-orbitron">
                    <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-rose-500/30 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 animate-pulse"></div>

                        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                            <FiAlertTriangle className="text-rose-500 text-4xl" />
                        </div>

                        <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">
                            SYSTEM <span className="text-rose-500">FAILURE</span>
                        </h1>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] mb-8">
                            Critical Exception Detected
                        </p>

                        <div className="bg-black/50 rounded-xl p-4 mb-8 border border-white/5 text-left">
                            <p className="text-[10px] font-mono text-rose-400 break-words uppercase">
                                {this.state.error?.message || 'Unknown Runtime Error'}
                            </p>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all mx-auto group"
                        >
                            <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-500" />
                            Reboot System
                        </button>

                        <div className="mt-8 flex items-center justify-between opacity-20">
                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Error Code: 0xpantcake</span>
                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Sector: Global_Core</span>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
