import { gsap } from 'gsap';

/**
 * SplitText utility to wrap characters or words in spans
 */
export const splitText = (element: HTMLElement | null, type: 'chars' | 'words' = 'chars') => {
    if (!element) return [];
    
    const text = element.innerText;
    element.innerHTML = '';
    
    if (type === 'chars') {
        const chars = text.split('').map(char => {
            const span = document.createElement('span');
            span.innerText = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            span.style.whiteSpace = 'pre';
            element.appendChild(span);
            return span;
        });
        return chars;
    } else {
        const words = text.split(' ').map(word => {
            const span = document.createElement('span');
            span.innerText = word + '\u00A0';
            span.style.display = 'inline-block';
            element.appendChild(span);
            return span;
        });
        return words;
    }
};

/**
 * Blur Reveal animation variant
 */
export const blurReveal = (element: HTMLElement | null, delay: number = 0) => {
    if (!element) return;
    
    const chars = splitText(element);
    gsap.from(chars, {
        filter: "blur(15px)",
        opacity: 0,
        y: 20,
        stagger: 0.02,
        duration: 1,
        ease: "expo.out",
        delay: delay,
        scrollTrigger: {
            trigger: element,
            start: "top 90%",
        }
    });
};

/**
 * Scramble animation using GSAP onUpdate
 */
export const scrambleText = (
    element: HTMLElement | null, 
    text: string, 
    duration: number = 2,
    onComplete?: () => void
) => {
    if (!element) return;
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    const obj = { value: 0 };
    
    gsap.to(obj, {
        value: 1,
        duration: duration,
        ease: "none",
        onUpdate: () => {
            const revealCount = Math.floor(obj.value * text.length);
            let result = text.substring(0, revealCount);
            
            for (let i = revealCount; i < text.length; i++) {
                if (text[i] === ' ') {
                    result += ' ';
                } else {
                    result += chars[Math.floor(Math.random() * chars.length)];
                }
            }
            element.innerText = result;
        },
        onComplete: onComplete
    });
};
