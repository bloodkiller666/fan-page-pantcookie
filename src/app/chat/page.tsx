import type { Metadata } from 'next';
import Chat from '@/views/Chat';

export const metadata: Metadata = { title: "Chat con pantcake IA" };

export default function Page() {
    return <Chat />;
}
