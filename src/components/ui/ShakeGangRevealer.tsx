'use client';
import { useRef, forwardRef, useImperativeHandle } from 'react';
import { gsap } from 'gsap';

// One colour per panel, drawn from the palette
const PANEL_COLORS = ['#ff007f', '#180917', '#0070ff', '#ffee00', '#00f3ff', '#180917'];

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
      aria-hidden
      className="fixed inset-0 z-[11000] pointer-events-none overflow-hidden invisible opacity-0"
    >
      <div
        className="absolute top-1/2 left-1/2 flex flex-col justify-center items-center w-[150vw] h-[150vh]"
        style={{ transform: 'translate(-50%, -50%) rotate(-15deg)' }}
      >
        {PANEL_COLORS.map((color, i) => (
          <div
            key={i}
            ref={(el) => { panelsRef.current[i] = el; }}
            className="w-full h-full flex-1"
            style={{ background: color, willChange: 'transform' }}
          />
        ))}
      </div>

      {/* Brand wordmark over the panels */}
      <div
        ref={textRef}
        className="absolute inset-0 flex flex-col items-center justify-center z-20 opacity-0 pointer-events-none"
      >
        <span className="font-display font-bold uppercase leading-none tracking-tight text-[#180917] text-6xl md:text-[9vw] bg-[#ffee00] border-[3px] border-[#180917] px-6 py-3 shadow-[10px_10px_0_#180917]">
          Shake<span className="text-[#ff007f]">-</span>Gang
        </span>
      </div>
    </div>
  );
});

ShakeGangRevealer.displayName = 'ShakeGangRevealer';

export default ShakeGangRevealer;
