import type { Metadata } from 'next';
import Cerrado from '@/views/Cerrado';

export const metadata: Metadata = { title: 'Zona cerrada', robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ de?: string }> }) {
    const { de } = await searchParams;
    return <Cerrado from={typeof de === 'string' ? de : ''} />;
}
