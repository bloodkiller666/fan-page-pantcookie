import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGameSounds } from '../../hooks/useGameSounds';

const PuzzleBoard = ({ image, difficulty, onComplete, isCompleted = false }: { image: string, difficulty: string, onComplete: () => void, isCompleted?: boolean }) => {
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
            // Artificial delay for smooth transition and ensuring image is cached
            setTimeout(() => {
                initializePuzzle();
                setIsLoading(false);
            }, 500);
        };
        img.src = image;
    }, [image, difficulty]);

    const initializePuzzle = () => {
        // Create ordered array [0, 1, 2, ..., totalTiles-1]
        const newTiles = Array.from({ length: totalTiles }, (_, i) => i);

        // Shuffle tiles
        const shuffled = shuffleArray(newTiles);
        setTiles(shuffled);
        setSelectedTileIndex(null);
    };

    const shuffleArray = (array) => {
        const arr = [...array];
        // Fisher-Yates shuffle
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }

        // Ensure it's not already solved by random chance (highly unlikely for large grids but good practice)
        if (isPuzzleComplete(arr)) {
            // Swap first two
            [arr[0], arr[1]] = [arr[1], arr[0]];
        }

        return arr;
    };

    const handleTileClick = (index: number) => {
        if (isCompleted) return;

        // Prevent moving tiles that are already in correct position
        const tileNumber = tiles[index];
        if (tileNumber === index) {
            playIncorrect();
            return;
        }

        if (selectedTileIndex === null) {
            // Select first tile
            playSelect();
            setSelectedTileIndex(index);
        } else {
            // Selected second tile, swap them
            if (selectedTileIndex === index) {
                // Deselect if clicking same tile
                playSelect();
                setSelectedTileIndex(null);
                return;
            }

            // Check if second tile is locked
            if (tiles[index] === index) {
                playIncorrect();
                return;
            }

            swapTiles(selectedTileIndex, index);
        }
    };

    const swapTiles = (index1, index2) => {
        const newTiles = [...tiles];
        [newTiles[index1], newTiles[index2]] = [newTiles[index2], newTiles[index1]];

        playSwap();
        setTiles(newTiles);
        setSelectedTileIndex(null);

        // Check completion
        if (isPuzzleComplete(newTiles)) {
            playCorrect(); // Play mini success sound
            setTimeout(() => {
                onComplete();
            }, 300);
        }
    };

    const isPuzzleComplete = (tilesArray) => {
        for (let i = 0; i < tilesArray.length; i++) {
            if (tilesArray[i] !== i) return false;
        }
        return true;
    };

    const getTileStyle = (tileNumber) => {
        // Calculate original row/col of the tile part
        const row = Math.floor(tileNumber / gridSize);
        const col = tileNumber % gridSize;

        // Calculate percentages for background position
        // For a grid of N, we need to show content from 0 to 100%. 
        // 0% is left edge, 100% is right edge.
        // The center of the column C (0-indexed) depends on the scale.
        // Standard formula for CSS sprites/grids: pos = (index / (total - 1)) * 100%

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
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-pink dark:border-primary-pink mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300 font-semibold">{t('games.puzzle.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full">
            <div
                className={`grid transition-all duration-700 bg-background-dark/40 p-3 rounded-2xl shadow-3xl border-2 border-primary/30 overflow-hidden relative
                    ${isCompleted ? 'gap-0 ring-4 ring-primary shadow-[0_0_50px_rgba(13,185,242,0.3)]' : 'gap-1.5'}`}
                style={{
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    width: '100%',
                    maxWidth: '800px',
                    aspectRatio: '1',
                }}
            >
                {tiles.map((tileNumber, index) => {
                    const isSelected = selectedTileIndex === index;
                    const isCorrectPosition = tileNumber === index;

                    return (
                        <div
                            key={index}
                            onClick={() => handleTileClick(index)}
                            className={`
                                relative transition-all duration-300 overflow-hidden rounded-md
                                ${isCompleted 
                                    ? 'z-0 opacity-100 cursor-default' 
                                    : isCorrectPosition
                                        ? 'z-0 cursor-default ring-2 ring-primary/20 hover:brightness-110'
                                        : 'cursor-pointer hover:scale-[1.03] hover:brightness-110 hover:z-10'
                                }
                                ${isSelected && !isCompleted ? 'z-20 ring-4 ring-primary shadow-[0_0_25px_rgba(13,185,242,0.8)] scale-90 rounded-xl' : ''}
                            `}
                            style={getTileStyle(tileNumber)}
                        >
                            {/* Correct Position Indicator */}
                            {isCorrectPosition && !isCompleted && (
                                <div className="absolute inset-0 ring-inset ring-4 ring-primary/20 pointer-events-none">
                                    <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_10px_rgba(13,185,242,1)] animate-pulse"></div>
                                </div>
                            )}

                            {/* Selection Overlay */}
                            {isSelected && !isCompleted && (
                                <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] pointer-events-none animate-pulse"></div>
                            )}
                            
                            {/* Hover effect for movable tiles */}
                            {!isCorrectPosition && !isCompleted && (
                                <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>
                            )}
                        </div>
                    );
                })}
                
                {/* Border Glow for completed puzzle */}
                {isCompleted && (
                    <div className="absolute inset-0 pointer-events-none border-[12px] border-primary/5 rounded-xl"></div>
                )}
            </div>

            {!isCompleted && (
                <div className="mt-8 flex flex-col md:flex-row items-center gap-4 bg-primary/5 px-6 py-3 rounded-2xl border border-primary/20 backdrop-blur-sm animate-fade-in shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">info</span>
                        <p className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                            {t('games.puzzle.instruction') || 'Intercambia piezas para completar la imagen'}
                        </p>
                    </div>
                    <div className="h-4 w-[1px] bg-primary/20 hidden md:block"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(13,185,242,1)]"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                            Piezas bloqueadas se iluminan
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PuzzleBoard;