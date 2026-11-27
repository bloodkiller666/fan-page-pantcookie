import { Suspense } from 'react';
import type { Metadata } from 'next';
import Games from '@/views/Games';

export const metadata: Metadata = { title: "Juegos" };

export default function Page() {
    return (
        <Suspense fallback={null}>
            <Games />
        </Suspense>
    );
}
