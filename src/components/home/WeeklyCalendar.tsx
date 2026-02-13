import React from 'react';
import calendarData from '../../data/calendar.json';

const WeeklyCalendar = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
            {calendarData.map((item, index) => (
                <div
                    key={index}
                    className="poke-card p-6 border-[#FFF89A] dark:border-[#FFD700]/50"
                    style={{ borderWidth: '4px' }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl drop-shadow-md">{item.icon}</span>
                        <span className="text-xs font-black uppercase tracking-widest text-pokemon-blue">{item.time}</span>
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-2">
                        {item.day}
                    </h3>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase leading-snug">
                        {item.activity}
                    </p>

                    {/* Pokemon-style decorative dots */}
                    <div className="absolute bottom-3 right-3 flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-pokemon-pink"></div>
                        <div className="w-2 h-2 rounded-full bg-pokemon-yellow"></div>
                        <div className="w-2 h-2 rounded-full bg-pokemon-blue"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default WeeklyCalendar;
