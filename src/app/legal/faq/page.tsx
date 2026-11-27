import type { Metadata } from 'next';
import Faq from '@/views/legal/faq';

export const metadata: Metadata = { title: "Preguntas frecuentes" };

export default function Page() {
    return <Faq />;
}
