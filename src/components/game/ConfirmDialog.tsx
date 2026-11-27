'use client';
import { ReactNode } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import GameDialog from './GameDialog';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    body?: string;
    icon?: ReactNode;
    onYes: () => void;
    onNo: () => void;
}

/** Yes / no confirmation in the shared game-dialog style. Escape answers "no". */
export default function ConfirmDialog({ open, title, body, icon, onYes, onNo }: ConfirmDialogProps) {
    const { t } = useLanguage();

    return (
        <GameDialog open={open} onClose={onNo} title={title} icon={icon} tone="yellow">
            {body && <p className="text-lg font-semibold leading-snug">{body}</p>}
            <div className="mt-6 grid grid-cols-2 gap-4">
                <button type="button" onClick={onYes} className="btn">
                    {t('common.yes') || 'Sí'}
                </button>
                <button type="button" onClick={onNo} className="btn btn--ghost">
                    {t('common.no') || 'No'}
                </button>
            </div>
        </GameDialog>
    );
}
