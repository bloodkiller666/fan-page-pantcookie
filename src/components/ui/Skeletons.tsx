'use client';
import React from 'react';

export const CardSkeleton = () => (
    <div className="w-full h-[50vh] rounded-3xl bg-zinc-900/50 border border-white/5 animate-pulse overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        <div className="absolute bottom-6 left-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800"></div>
            <div className="space-y-2">
                <div className="w-32 h-6 bg-zinc-800 rounded-md"></div>
                <div className="w-20 h-3 bg-zinc-800/50 rounded-md"></div>
            </div>
        </div>
    </div>
);

export const ChartSkeleton = () => (
    <div className="w-full h-[320px] bg-zinc-900/20 rounded-3xl border border-white/5 animate-pulse flex flex-col p-8">
        <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
                <div className="w-2 h-8 bg-zinc-800 rounded-full"></div>
                <div className="space-y-2">
                    <div className="w-48 h-5 bg-zinc-800 rounded-md"></div>
                    <div className="w-32 h-2 bg-zinc-800/50 rounded-md"></div>
                </div>
            </div>
            <div className="flex gap-2">
                <div className="w-24 h-10 bg-zinc-800 rounded-xl"></div>
                <div className="w-24 h-10 bg-zinc-800 rounded-xl"></div>
            </div>
        </div>
        <div className="flex-grow flex items-end gap-2 px-4 pb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex-grow bg-zinc-800/30 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
            ))}
        </div>
    </div>
);

export const MetricSkeleton = () => (
    <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/5 animate-pulse flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-800"></div>
            <div className="space-y-2">
                <div className="w-16 h-2 bg-zinc-800/50 rounded-md"></div>
                <div className="w-20 h-6 bg-zinc-800 rounded-md"></div>
            </div>
        </div>
        <div className="w-10 h-4 bg-zinc-800/50 rounded-md"></div>
    </div>
);
