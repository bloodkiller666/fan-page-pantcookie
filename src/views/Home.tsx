'use client';
import { useEffect, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LoadingScreen from '../components/ui/LoadingScreen';
import Hero from '../components/home/Hero';
import Ticker from '../components/home/Ticker';
import SocialStats from '../components/home/SocialStats';
import WeeklySchedule from '../components/home/WeeklySchedule';
import Destinations from '../components/home/Destinations';
import YouTubeFeedComponent from '../components/home/YouTubeFeedComponent';
import UpdateNotice from '../components/home/UpdateNotice';

const ONBOARDING_KEY = 'shakegang_onboarding_done';

export default function Home() {
    // 'init' renders the page (server HTML stays visible); first-time visitors then get the boot screen.
    const [phase, setPhase] = useState<'init' | 'loading' | 'done'>('init');

    useEffect(() => {
        if (localStorage.getItem(ONBOARDING_KEY)) {
            setPhase('done');
            return;
        }
        setPhase('loading');
        const onDone = () => {
            localStorage.setItem(ONBOARDING_KEY, 'true');
            setPhase('done');
        };
        window.addEventListener('loading_complete', onDone);
        return () => window.removeEventListener('loading_complete', onDone);
    }, []);

    // Pinned sections measure the page: re-measure once fonts and the loader are settled.
    useEffect(() => {
        if (phase !== 'done') return;
        let cancelled = false;
        document.fonts?.ready.then(() => !cancelled && ScrollTrigger.refresh());
        const onLoad = () => ScrollTrigger.refresh();
        window.addEventListener('load', onLoad);
        return () => {
            cancelled = true;
            window.removeEventListener('load', onLoad);
        };
    }, [phase]);

    return (
        <>
            {phase === 'loading' && <LoadingScreen />}

            <div>
                <Hero />
                <Ticker />
                <SocialStats />
                <WeeklySchedule />
                <Destinations />
                <YouTubeFeedComponent />
                <UpdateNotice parentLoading={phase !== 'done'} />
            </div>
        </>
    );
}
