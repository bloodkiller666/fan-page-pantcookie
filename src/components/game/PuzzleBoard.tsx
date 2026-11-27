import { useState, useEffect } from 'react';
import { MdDone, MdInfo } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';
import { useGameSounds } from '../../hooks/useGameSounds';

const PuzzleBoard = ({ image, difficulty, onComplete, isCompleted = false }: { image: string; difficulty: string; onComplete: () => void; isCompleted?: boolean }) => {
    const { t } = useLanguage();
    const { playSelect, playSwap, playIncorrect, playCorrect } = useGameSounds();
    const [tiles, setTiles] = useState<number[]>([]);
    const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Difficulty mapping
    const gridSize = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
    const totalTiles = gridSize * gridSize;

    // Initialize puzzle
    useEffect(() => {
        if (!image) return;

        setIsLoading(true);
        const img = new Image();

        img.onload = () => {
            // Short delay for a smooth transition and so the image is cached
            setTimeout(() => {
                initializePuzzle();
                setIsLoading(false);
            }, 500);
        };
        img.src = image;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [image, difficulty]);

    const initializePuzzle = () => {
        const ordered = Array.from({ length: totalTiles }, (_, i) => i);
        setTiles(shuffleArray(ordered));
        setSelectedTileIndex(null);
    };

    const shuffleArray = (array: number[]) => {
        const arr = [...array];
        // Fisher-Yates shuffle
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        // Never hand the player an already-solved board
        if (isPuzzleComplete(arr)) {
            [arr[0], arr[1]] = [arr[1], arr[0]];
        }
        return arr;
    };

    const handleTileClick = (index: number) => {
        if (isCompleted) return;

        // Tiles already in the right place are locked
        if (tiles[index] === index) {
            playIncorrect();
            return;
        }

        if (selectedTileIndex === null) {
            playSelect();
            setSelectedTileIndex(index);
            return;
        }

        if (selectedTileIndex === index) {
            playSelect();
            setSelectedTileIndex(null);
            return;
        }

        swapTiles(selectedTileIndex, index);
    };

    const swapTiles = (index1: number, index2: number) => {
        const newTiles = [...tiles];
        [newTiles[index1], newTiles[index2]] = [newTiles[index2], newTiles[index1]];

        playSwap();
        setTiles(newTiles);
        setSelectedTileIndex(null);

        if (isPuzzleComplete(newTiles)) {
            playCorrect();
            setTimeout(() => onComplete(), 300);
        }
    };

    const isPuzzleComplete = (tilesArray: number[]) => tilesArray.every((tile, i) => tile === i);

    const getTileStyle = (tileNumber: number) => {
        const row = Math.floor(tileNumber / gridSize);
        const col = tileNumber % gridSize;
        const xPos = gridSize > 1 ? (col / (gridSize - 1)) * 100 : 0;
        const yPos = gridSize > 1 ? (row / (gridSize - 1)) * 100 : 0;

        return {
            backgroundImage: `url(${image})`,
            backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
            backgroundPosition: `${xPos}% ${yPos}%`,
        };
    };

    if (isLoading) {
        return (
            <div className="flex h-96 flex-col items-center justify-center gap-5" role="status">
                <div className="hud-bar hud-bar--pink w-64 animate-pulse" style={{ ['--v' as string]: 60 }} />
                <p className="score text-xs">{t('games.puzzle.loading')}</p>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col items-center">
            <div
                className={`relative grid w-full max-w-[800px] border-[3px] border-[var(--line)] bg-[var(--line)] p-[3px] shadow-[8px_8px_0_var(--shadow)] transition-[gap] duration-700 ${isCompleted ? 'gap-0' : 'gap-[3px]'}`}
                style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, aspectRatio: '1' }}
            >
                {tiles.map((tileNumber, index) => {
                    const isSelected = selectedTileIndex === index;
                    const inPlace = tileNumber === index;

                    return (
                        <button
                            type="button"
                            key={index}
                            onClick={() => handleTileClick(index)}
                            disabled={isCompleted}
                            aria-disabled={inPlace}
                            aria-pressed={isSelected}
                            aria-label={`${index + 1}`}
                            className={`relative overflow-hidden transition-transform duration-150 ${
                                isCompleted
                                    ? 'cursor-default'
                                    : inPlace
                                      ? 'cursor-default'
                                      : 'cursor-pointer hover:z-10 hover:brightness-110'
                            } ${isSelected && !isCompleted ? 'z-20 scale-[0.88] outline outline-[4px] outline-[var(--pink)]' : ''}`}
                            style={getTileStyle(tileNumber)}
                        >
                            {inPlace && !isCompleted && (
                                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center border-2 border-[var(--ink)] bg-[var(--cyan)] text-[var(--ink)]" aria-hidden>
                                    <MdDone className="text-sm" />
                                </span>
                            )}
                            {isSelected && !isCompleted && <span className="absolute inset-0 bg-[var(--pink)]/25" aria-hidden />}
                        </button>
                    );
                })}
            </div>

            {!isCompleted && (
                <div className="mt-8 flex flex-col items-center gap-3 border-[3px] border-[var(--line)] bg-[var(--surface)] px-5 py-3 md:flex-row md:gap-6">
                    <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.08em]">
                        <MdInfo className="text-xl text-[var(--blue)]" aria-hidden />
                        {t('games.puzzle.instruction')}
                    </p>
                    <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                        <span className="flex h-5 w-5 items-center justify-center border-2 border-[var(--ink)] bg-[var(--cyan)] text-[var(--ink)]" aria-hidden>
                            <MdDone className="text-sm" />
                        </span>
                        {t('games.puzzle.correctPieces')}
                    </p>
                </div>
            )}
        </div>
    );
};

export default PuzzleBoard;
