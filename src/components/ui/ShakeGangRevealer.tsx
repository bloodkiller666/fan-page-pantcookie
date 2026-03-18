'use client';
import { useRef, forwardRef, useImperativeHandle } from 'react';
import { gsap } from 'gsap';

const PANEL_COUNT = 6;

const ShakeGangRevealer = forwardRef((props, ref) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<(HTMLDivElement | null)[]>([]);
  const textRef = useRef<HTMLDivElement>(null);

  const isAnimatingIn = useRef(false);
  const pendingOut = useRef(false);
  const inTimelineRef = useRef<gsap.core.Timeline | null>(null);

  const triggerOut = () => {
    const panels = panelsRef.current.filter(Boolean);
    if (!overlayRef.current || panels.length === 0) return;

    const tlOut = gsap.timeline();

    tlOut.to(textRef.current, {
      opacity: 0,
      y: -15,
      duration: 0.25,
      ease: 'power2.in',
    });

    tlOut.to(panels, {
      xPercent: 110,
      duration: 0.5,
      ease: 'power3.inOut',
      stagger: { amount: 0.25, from: 'end' },
    }, '-=0.05');

    tlOut.set(overlayRef.current, { autoAlpha: 0, pointerEvents: 'none' });
  };

  useImperativeHandle(ref, () => ({
    animateIn: () => {
      pendingOut.current = false;
      const panels = panelsRef.current.filter(Boolean);

      if (!overlayRef.current || panels.length === 0) {
        return Promise.resolve();
      }

      if (inTimelineRef.current) {
        inTimelineRef.current.kill();
      }

      isAnimatingIn.current = true;
      const tl = gsap.timeline({
        onComplete: () => {
          isAnimatingIn.current = false;
          if (pendingOut.current) {
            triggerOut();
            pendingOut.current = false;
          }
        }
      });
      inTimelineRef.current = tl;

      tl.set(overlayRef.current, { autoAlpha: 1, pointerEvents: 'all' });
      tl.set(panels, { xPercent: -120 });
      tl.set(textRef.current, { opacity: 0, y: 20 });

      tl.to(panels, {
        xPercent: 0,
        duration: 0.5,
        ease: 'power3.inOut',
        stagger: 0.06,
      });

      tl.to(
        textRef.current,
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
        '-=0.2'
      );

      return tl;
    },

    animateOut: () => {
      if (isAnimatingIn.current) {
        pendingOut.current = true;
      } else {
        triggerOut();
      }
      return Promise.resolve();
    },
  }));

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden invisible opacity-0"
    >
      <div
        className="absolute top-1/2 left-1/2 flex flex-col justify-center items-center w-[150vw] h-[150vh]"
        style={{ transform: 'translate(-50%, -50%) rotate(-15deg)' }}
      >
        {Array.from({ length: PANEL_COUNT }).map((_, i) => (
          <div
            key={i}
            ref={(el) => { panelsRef.current[i] = el; }}
            className="w-full h-full bg-[#050505] flex-1 border-b border-t border-[#0a0a0a]/20"
            style={{
              background: i % 2 === 0 ? '#050505' : '#080808',
              willChange: 'transform'
            }}
          />
        ))}
      </div>

      <div
        className="absolute top-1/2 left-1/2 pointer-events-none z-10 w-[150vw] h-[150vh] flex"
        style={{ transform: 'translate(-50%, -50%) rotate(-15deg)', opacity: 0.07 }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-full w-[1px] bg-white absolute"
            style={{
              left: `${15 + i * 10}%`,
            }}
          />
        ))}
      </div>

      {/* Brand text centered over the panels */}
      <div
        ref={textRef}
        className="absolute inset-0 flex flex-col items-center justify-center z-20 opacity-0 pointer-events-none"
      >
        {/* SHAKE */}
        <h1
          className="text-7xl md:text-[10vw] lg:text-[8vw] font-black italic uppercase tracking-tighter text-white neon-text-pink leading-none"
          style={{ textShadow: '0 0 40px rgba(255,46,151,0.6), 0 0 80px rgba(255,46,151,0.3)' }}
        >
          SHAKE
        </h1>
        {/* GANG */}
        <span
          className="text-4xl md:text-[4.5vw] lg:text-[3.5vw] font-bold uppercase tracking-[0.3em] -mt-2"
          style={{ color: '#9146FF', textShadow: '0 0 30px rgba(145,70,255,0.7)' }}
        >
          GANG
        </span>
      </div>
    </div>
  );
});

ShakeGangRevealer.displayName = 'ShakeGangRevealer';

export default ShakeGangRevealer;
