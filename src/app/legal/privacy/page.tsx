import type { Metadata } from 'next';
import Privacy from '@/views/legal/privacy';

export const metadata: Metadata = { title: "Política de privacidad" };

export default function Page() {
    return <Privacy />;
}
