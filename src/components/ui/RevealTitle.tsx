import type { ElementType, ReactNode } from 'react';

/**
 * Heading whose text slides up from a mask when scrolled into view
 * (animated by `useScrollReveal`). The text node stays React-owned, so
 * language changes re-render safely.
 */
export default function RevealTitle({
    as: Tag = 'h2',
    className = '',
    children,
}: {
    as?: ElementType;
    className?: string;
    children: ReactNode;
}) {
    return (
        <Tag className={className}>
            <span className="block overflow-hidden pb-[0.12em]">
                <span data-reveal-line className="block">
                    {children}
                </span>
            </span>
        </Tag>
    );
}
