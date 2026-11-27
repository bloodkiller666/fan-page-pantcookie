'use client';
import { useMemo, useRef, useState } from 'react';
import { MdAdd, MdRemove, MdSearch } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import RevealTitle from '../../components/ui/RevealTitle';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  title: string;
  items: FaqItem[];
}

const TONES = ['bg-[var(--pink)]', 'bg-[var(--cyan)]', 'bg-[var(--yellow)]', 'bg-[var(--blue)] text-white'];

export default function Faq() {
  const { t, language } = useLanguage();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    const raw = t('legal.faqCategories');
    const data: Record<string, FaqCategory> = raw && typeof raw === 'object' ? raw : {};
    const q = query.trim().toLowerCase();

    return Object.entries(data)
      .map(([id, category]) => ({
        id,
        title: category.title,
        // Keep each item's original index so the open key stays stable while filtering
        items: category.items
          .map((item, index) => ({ ...item, index }))
          .filter((item) => !q || item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)),
      }))
      .filter((category) => category.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, query]);

  const total = categories.reduce((sum, c) => sum + c.items.length, 0);

  useScrollReveal(rootRef, [language, categories.length]);

  return (
    <div ref={rootRef} className="mx-auto max-w-[1000px] px-4 py-12 sm:px-6 sm:py-16">
      <RevealTitle as="h1" className="font-display text-[clamp(2.4rem,7vw,5.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
        {t('footer.legal.faqTitle')}
      </RevealTitle>
      <p data-reveal className="mt-5 max-w-[60ch] text-lg font-medium text-[var(--muted)]">
        {t('legal.faqSubtitle')}
      </p>

      {/* Search */}
      <div data-reveal className="mt-10 max-w-xl">
        <label htmlFor="faq-search" className="sr-only">
          {t('legal.searchPlaceholder')}
        </label>
        <div className="relative">
        <MdSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-[var(--muted)]" aria-hidden />
        <input
          id="faq-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('legal.searchPlaceholder')}
          className="w-full border-[3px] border-[var(--line)] bg-[var(--surface)] py-3.5 pl-14 pr-4 font-display text-lg font-bold text-[var(--text)] shadow-[5px_5px_0_var(--shadow)] placeholder:font-medium placeholder:text-[var(--muted)] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
        />
        </div>
        {query && (
          <p className="mt-3 font-display text-sm font-bold uppercase tracking-[0.1em] text-[var(--muted)]" role="status">
            {String(t('legal.resultsCount')).replace('{n}', String(total))}
          </p>
        )}
      </div>

      {total === 0 && <p className="mt-16 font-display text-2xl font-bold uppercase text-[var(--muted)]">{t('legal.noResults')}</p>}

      <div className="mt-14 space-y-16">
        {categories.map((category, ci) => (
          <section key={category.id} aria-labelledby={`faq-${category.id}`}>
            <h2 id={`faq-${category.id}`} className={`inline-block border-[3px] border-[var(--ink)] px-4 py-2 font-display text-xl font-bold uppercase text-[var(--ink)] shadow-[4px_4px_0_var(--shadow)] ${TONES[ci % TONES.length]} ${ci % TONES.length === 3 ? '!text-white' : ''}`}>
              {category.title}
            </h2>

            <ul className="mt-8 space-y-5">
              {category.items.map((item) => {
                const key = `${category.id}-${item.index}`;
                const open = openKey === key;
                return (
                  <li key={key} data-reveal>
                    <div className="border-[3px] border-[var(--line)] bg-[var(--surface)] shadow-[5px_5px_0_var(--shadow)]">
                      <h3>
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-controls={`panel-${key}`}
                          id={`btn-${key}`}
                          onClick={() => setOpenKey(open ? null : key)}
                          className={`flex w-full items-center justify-between gap-6 px-5 py-4 text-left transition-colors ${open ? 'bg-[var(--yellow)] text-[var(--ink)]' : 'hover:bg-[var(--surface-2)]'}`}
                        >
                          <span className="font-display text-lg font-bold leading-snug sm:text-xl">{item.question}</span>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--pink)] text-[var(--ink)]" aria-hidden>
                            {open ? <MdRemove className="text-2xl" /> : <MdAdd className="text-2xl" />}
                          </span>
                        </button>
                      </h3>
                      {/* grid-rows 0fr -> 1fr animates height without measuring */}
                      <div id={`panel-${key}`} role="region" inert={!open} aria-labelledby={`btn-${key}`} className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                          <p className="border-t-[3px] border-[var(--line)] px-5 py-5 text-lg font-medium leading-relaxed">{item.answer}</p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
