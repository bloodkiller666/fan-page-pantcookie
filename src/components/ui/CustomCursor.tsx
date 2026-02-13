'use client';
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useCursor } from '../../context/CursorContext';
import { FiMusic, FiTarget } from 'react-icons/fi';

const CustomCursor = () => {
    const { cursorType } = useCursor();
    const [isPointer, setIsPointer] = useState(false);

    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    const springConfig = { damping: 25, stiffness: 400 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };

        const handleMouseDown = () => setIsPointer(true);
        const handleMouseUp = () => setIsPointer(false);

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (window.getComputedStyle(target).cursor === 'pointer' || target.tagName === 'BUTTON' || target.closest('button')) {
                setIsPointer(true);
            } else {
                setIsPointer(false);
            }
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mouseover', handleMouseOver);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseover', handleMouseOver);
        };
    }, [cursorX, cursorY]);

    // Hide default cursor
    useEffect(() => {
        document.body.style.cursor = 'none';
        return () => {
            document.body.style.cursor = 'auto';
        };
    }, []);

    const variants = {
        default: {
            height: 32,
            width: 32,
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            border: "2px solid rgba(0, 0, 0, 0.8)",
            mixBlendMode: "difference" as any
        },
        pointer: {
            height: 48,
            width: 48,
            backgroundColor: "rgba(255, 0, 255, 0.3)",
            border: "2px solid #ff00ff",
            mixBlendMode: "normal" as any
        },
        music: {
            height: 60,
            width: 60,
            backgroundColor: "rgba(0, 255, 255, 0.2)",
            border: "2px solid #00ffff",
            borderRadius: "50%",
            mixBlendMode: "normal" as any
        },
        game: {
            height: 40,
            width: 40,
            backgroundColor: "transparent",
            border: "2px solid #ffff00",
            borderRadius: "0%", // Square/Diamond for game
            rotate: 45,
            mixBlendMode: "normal" as any
        },
        hidden: {
            opacity: 0
        }
    };

    return (
        <motion.div
            className="fixed top-0 left-0 pointer-events-none z-[99999] rounded-full flex items-center justify-center backdrop-blur-sm"
            style={{
                x: cursorXSpring,
                y: cursorYSpring,
                translateX: '-50%',
                translateY: '-50%',
            }}
            variants={variants}
            animate={cursorType}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
        >
            {cursorType === 'music' && (
                <FiMusic className="text-cyan-400 text-xl animate-bounce" />
            )}
            {cursorType === 'game' && (
                <FiTarget className="text-yellow-400 text-xl -rotate-45" />
            )}
            {cursorType === 'default' && (
                <div className="w-2 h-2 bg-black rounded-full" />
            )}
        </motion.div>
    );
};

export default CustomCursor;
