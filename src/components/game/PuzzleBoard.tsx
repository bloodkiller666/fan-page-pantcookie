import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGameSounds } from '../../hooks/useGameSounds';

const PuzzleBoard = ({ image, difficulty, onComplete }) => {
    const { t } = useLanguage();
    const { playSelect, playSwap, playIncorrect, playCorrect } = useGameSounds();
    const [tiles, setTiles] = useState<number[]>([]);
    const [selectedTileIndex, setSelectedTileIndex] = useState(null);
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

    const handleTileClick = (index) => {
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
        <div className="flex flex-col items-center">
            <div
                className="grid gap-[2px] bg-gray-800 p-2 rounded-xl shadow-2xl neon-border overflow-hidden"
                style={{
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    width: 'min(800px, 95vw)', // Much larger max width
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
                                relative transition-all duration-200 overflow-hidden
                                ${isCorrectPosition
                                    ? 'z-0 opacity-100 cursor-default ring-1 ring-green-500/50'
                                    : 'cursor-pointer hover:brightness-110 hover:sepia-[.5]'
                                }
                                ${isSelected ? 'z-10 ring-4 ring-primary-pink shadow-[0_0_15px_rgba(255,0,255,0.6)] scale-95 rounded-lg' : ''}
                            `}
                            style={getTileStyle(tileNumber)}
                        >
                            {/* Locked Indicator */}
                            {isCorrectPosition && (
                                <div className="absolute inset-0 ring-inset ring-2 ring-green-400/30 pointer-events-none">
                                    <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_rgba(0,255,0,0.8)]"></div>
                                </div>
                            )}

                            {/* Selection Overlay */}
                            {isSelected && (
                                <div className="absolute inset-0 bg-primary-pink/20 pointer-events-none"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                <span>Haz clic en una pieza y luego en otra para intercambiarlas.</span>
                <span className="flex items-center gap-1 text-green-500">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    Piezas correctas se bloquean.
                </span>
            </p>
        </div>
    );
};

export default PuzzleBoard;
