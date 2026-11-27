import { Suspense } from 'react';
import type { Metadata } from 'next';
import Mensajes from '@/views/Mensajes';

export const metadata: Metadata = { title: "Muro de mensajes" };

export default function Page() {
    return (
        <Suspense fallback={null}>
            <Mensajes />
        </Suspense>
    );
}
