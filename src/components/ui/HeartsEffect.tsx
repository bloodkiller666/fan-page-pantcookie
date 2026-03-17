'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function HeartsEffect() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const createHeart = () => {
            if (!containerRef.current) return;
            
            const heart = document.createElement('div');
            heart.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>`;
            heart.style.position = 'absolute';
            heart.style.color = '#FF2E97'; // primary-pink
            heart.style.left = Math.random() * 100 + '%';
            heart.style.top = '100%';
            heart.style.opacity = '0';
            heart.style.filter = 'drop-shadow(0 0 5px rgba(255,46,151,0.5))';
            
            containerRef.current.appendChild(heart);

            const size = Math.random() * 20 + 10;
            const duration = Math.random() * 3 + 2;
            
            gsap.set(heart, { scale: 0 });

            gsap.to(heart, {
                y: -window.innerHeight - 100,
                x: (Math.random() - 0.5) * 200,
                opacity: 0.8,
                scale: size / 24,
                duration: duration,
                ease: "power1.out",
                onComplete: () => heart.remove()
            });

            gsap.to(heart, {
                opacity: 0,
                duration: 0.5,
                delay: duration - 0.5,
                ease: "power1.in"
            });
        };

        const interval = setInterval(createHeart, 500);
        return () => clearInterval(interval);
    }, []);

    return <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[50]" />;
}
