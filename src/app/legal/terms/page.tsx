import type { Metadata } from 'next';
import Terms from '@/views/legal/terms';

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function Page() {
    return <Terms />;
}
