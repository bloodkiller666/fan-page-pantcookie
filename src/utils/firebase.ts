import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, onSnapshot, where, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Submit a score to the leaderboard
export const submitScore = async (playerName, time, difficulty) => {
    try {
        const docRef = await addDoc(collection(db, 'scores'), {
            playerName: playerName.trim(),
            time: time,
            difficulty: difficulty,
            timestamp: new Date()
        });
        console.log('Score submitted with ID:', docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error submitting score:', error);
        return { success: false, error: error.message };
    }
};

// Get leaderboard for a specific difficulty
export const getLeaderboard = async (difficulty, limitCount = 10) => {
    try {
        const q = query(
            collection(db, 'scores'),
            orderBy('time', 'asc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const scores: any[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.difficulty === difficulty) {
                scores.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        return scores.slice(0, limitCount);
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        return [];
    }
};

// Real-time listener for leaderboard updates
export const subscribeToLeaderboard = (difficulty, callback, limitCount = 10) => {
    const q = query(
        collection(db, 'scores'),
        orderBy('time', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const scores: any[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.difficulty === difficulty) {
                scores.push({
                    id: doc.id,
                    ...data
                });
            }
        });
        callback(scores.slice(0, limitCount));
    }, (error) => {
        console.error('Error in leaderboard subscription:', error);
        callback([]);
    });
};

// Chat functionality
export const sendMessage = async (sessionId: string, text: string, sender: 'user' | 'bot', fileUrl: string | null = null, fileName: string | null = null) => {
    try {
        await addDoc(collection(db, 'messages'), {
            sessionId,
            text,
            sender,
            fileUrl,
            fileName,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

export const subscribeToMessages = (sessionId: string, callback: (messages: any[]) => void) => {
    if (!sessionId) return () => {};
    
    const q = query(
        collection(db, 'messages'),
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                time: data.timestamp ? data.timestamp.toDate() : new Date()
            };
        });
        callback(messages);
    }, (error) => {
        console.error("Error subscribing to messages:", error);
    });
};

// Wall functionality
export const addWallMessage = async (username: string, country: string, text: string, imageUrl: string | null = null) => {
    try {
        await addDoc(collection(db, 'wall_messages'), {
            username,
            country,
            text,
            imageUrl,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding wall message:", error);
        throw error;
    }
};

export const subscribeToWallMessages = (callback: (messages: any[]) => void) => {
    const q = query(
        collection(db, 'wall_messages'),
        orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
            };
        });
        callback(messages);
    }, (error) => {
        console.error("Error subscribing to wall messages:", error);
    });
};

export { db };
