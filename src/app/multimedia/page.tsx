import type { Metadata } from 'next';
import Multimedia from '@/views/Multimedia';

export const metadata: Metadata = { title: "Multimedia" };

export default function Page() {
    return <Multimedia />;
}
