'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useCursor } from '../../context/CursorContext';
import { FiMusic, FiTarget } from 'react-icons/fi';

const CustomCursor = () => {
    const { cursorType } = useCursor();
    const cursorRef = useRef<HTMLDivElement>(null);
    const [isPointer, setIsPointer] = useState(false);

    useEffect(() => {
        if (!cursorRef.current) return;

        // Performant GSAP trackers
        const xTo = gsap.quickTo(cursorRef.current, "x", { duration: 0.4, ease: "power3" });
        const yTo = gsap.quickTo(cursorRef.current, "y", { duration: 0.4, ease: "power3" });

        const moveCursor = (e: MouseEvent) => {
            xTo(e.clientX);
            yTo(e.clientY);
        };

        const handleMouseDown = () => setIsPointer(true);
        const handleMouseUp = () => setIsPointer(false);

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (window.getComputedStyle(target).cursor === 'pointer' || target.tagName === 'BUTTON' || target.closest('button') || target.tagName === 'A') {
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
    }, []);

    // Hide default cursor
    useEffect(() => {
        document.body.style.cursor = 'none';
        return () => {
            document.body.style.cursor = 'auto';
        };
    }, []);

    useEffect(() => {
        if (!cursorRef.current) return;
        
        let targetProps = {};

        switch (cursorType) {
            case 'pointer':
                targetProps = {
                    height: 48,
                    width: 48,
                    backgroundColor: "rgba(255, 0, 255, 0.3)",
                    border: "2px solid #ff00ff",
                    borderRadius: "50%",
                    mixBlendMode: "normal",
                    rotation: 0,
                    opacity: 1
                };
                break;
            case 'music':
                targetProps = {
                    height: 60,
                    width: 60,
                    backgroundColor: "rgba(0, 255, 255, 0.2)",
                    border: "2px solid #00ffff",
                    borderRadius: "50%",
                    mixBlendMode: "normal",
                    rotation: 0,
                    opacity: 1
                };
                break;
            case 'game':
                targetProps = {
                    height: 40,
                    width: 40,
                    backgroundColor: "transparent",
                    border: "2px solid #ffff00",
                    borderRadius: "0%",
                    rotation: 45,
                    mixBlendMode: "normal",
                    opacity: 1
                };
                break;
            case 'hidden':
                targetProps = {
                    opacity: 0
                };
                break;
            // 'default' or fallback
            default:
                targetProps = {
                    height: 32,
                    width: 32,
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                    border: "2px solid rgba(0, 0, 0, 0.8)",
                    borderRadius: "50%",
                    mixBlendMode: "difference",
                    rotation: 0,
                    opacity: 1
                };
                break;
        }

        // Add a slight scaling effect if clicking (pointer logic mapping fallback)
        if (isPointer && cursorType === 'default') {
             targetProps = {
                ...targetProps,
                height: 48,
                width: 48,
                backgroundColor: "rgba(255, 0, 255, 0.3)",
                border: "2px solid #ff00ff",
                mixBlendMode: "normal"
            };
        }

        gsap.to(cursorRef.current, {
            ...targetProps,
            duration: 0.3,
            ease: "back.out(1.5)"
        });

    }, [cursorType, isPointer]);

    return (
        <div
            ref={cursorRef}
            className="fixed top-0 left-0 pointer-events-none z-[99999] flex items-center justify-center backdrop-blur-sm -translate-x-1/2 -translate-y-1/2"
            style={{
                width: 32,
                height: 32,
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                border: "2px solid rgba(0, 0, 0, 0.8)",
                borderRadius: "50%",
                mixBlendMode: "difference"
            }}
        >
            {cursorType === 'music' && (
                <FiMusic className="text-cyan-400 text-xl animate-bounce" />
            )}
            {cursorType === 'game' && (
                <FiTarget className="text-yellow-400 text-xl -rotate-45" />
            )}
            {cursorType === 'default' && !isPointer && (
                <div className="w-2 h-2 bg-black rounded-full" />
            )}
        </div>
    );
};

export default CustomCursor;
