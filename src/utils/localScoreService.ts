const STORAGE_KEY = 'local_puzzle_scores';
const TRIVIA_STORAGE_KEY = 'local_trivia_scores';

// Helper to get scores
const getLocalScores = (key = STORAGE_KEY) => {
    try {
        const scores = localStorage.getItem(key);
        return scores ? JSON.parse(scores) : [];
    } catch (error) {
        console.error('Error reading local scores:', error);
        return [];
    }
};

// Helper to save scores
const saveLocalScores = (scores, key = STORAGE_KEY) => {
    try {
        localStorage.setItem(key, JSON.stringify(scores));
        // Dispatch a custom event to notify listeners
        const eventName = key === TRIVIA_STORAGE_KEY ? 'local-trivia-update' : 'local-score-update';
        window.dispatchEvent(new CustomEvent(eventName));
    } catch (error) {
        console.error('Error saving local scores:', error);
    }
};

// Submit a puzzle score
export const submitScore = async (playerName, time, difficulty) => {
    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        const newScore = {
            id: Date.now().toString(), // Simple unique ID
            playerName: playerName.trim(),
            time: time,
            difficulty: difficulty,
            timestamp: new Date().toISOString()
        };

        const currentScores = getLocalScores(STORAGE_KEY);
        currentScores.push(newScore);
        saveLocalScores(currentScores, STORAGE_KEY);

        return { success: true, id: newScore.id };
    } catch (error) {
        console.error('Error submitting local score:', error);
        return { success: false, error: 'Failed' };
    }
};

// Submit a trivia score
export const submitTriviaScore = async (playerName, score, category) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
        const newScore = {
            id: Date.now().toString(),
            playerName: playerName.trim(),
            score: score,
            category: category,
            timestamp: new Date().toISOString()
        };
        const currentScores = getLocalScores(TRIVIA_STORAGE_KEY);
        currentScores.push(newScore);
        saveLocalScores(currentScores, TRIVIA_STORAGE_KEY);
        return { success: true, id: newScore.id };
    } catch (error) {
        return { success: false, error: 'Failed' };
    }
};

// Get leaderboard for a specific difficulty
export const getLeaderboard = async (difficulty, limitCount = 10) => {
    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const scores = getLocalScores();

    // Filter by difficulty and sort by time (ascending)
    const filteredScores = scores
        .filter(s => s.difficulty === difficulty)
        .sort((a, b) => a.time - b.time)
        .slice(0, limitCount);

    return filteredScores;
};

// Subscribe to puzzle leaderboard
export const subscribeToLeaderboard = (difficulty, callback, limitCount = 10) => {

    const updateCallback = () => {
        const scores = getLocalScores(STORAGE_KEY);
        const filteredScores = scores
            .filter(s => s.difficulty === difficulty)
            .sort((a, b) => a.time - b.time) // Ascending time
            .slice(0, limitCount);

        callback(filteredScores);
    };

    // Initial call
    updateCallback();

    // Listen for updates
    const handleUpdate = () => updateCallback();

    window.addEventListener('local-score-update', handleUpdate);

    // Also listen for storage events (in case multiple tabs are open)
    window.addEventListener('storage', handleUpdate);

    // Return unsubscribe function
    return () => {
        window.removeEventListener('local-score-update', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
    };
};

// Subscribe to trivia leaderboard
export const subscribeToTriviaLeaderboard = (category, callback, limitCount = 10) => {
    const updateCallback = () => {
        const scores = getLocalScores(TRIVIA_STORAGE_KEY);
        const filteredScores = scores
            .filter(s => s.category === category)
            .sort((a, b) => b.score - a.score) // Descending score
            .slice(0, limitCount);
        callback(filteredScores);
    };
    updateCallback();
    const handleUpdate = () => updateCallback();
    window.addEventListener('local-trivia-update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
        window.removeEventListener('local-trivia-update', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
    };
};
