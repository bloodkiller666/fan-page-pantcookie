import { FiClock } from 'react-icons/fi';

const Timer = ({ isRunning, elapsedTime, onTimeUpdate }) => {
    React.useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                onTimeUpdate((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, onTimeUpdate]);

    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;

    return (
        <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-primary-pink to-primary-blue text-white px-6 py-4 rounded-xl shadow-lg">
            <FiClock className="w-6 h-6" />
            <div className="text-3xl font-bold font-mono">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </div>
        </div>
    );
};

// Add React import at the top
import React from 'react';

export default Timer;
