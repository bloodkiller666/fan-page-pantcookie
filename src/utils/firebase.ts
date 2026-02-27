import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, onSnapshot, where, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';

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
    console.log("Setting up wall_messages listener...");
    const q = query(
        collection(db, 'wall_messages'),
        orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        console.log(`Snapshot received. Docs count: ${snapshot.docs.length}`);
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

// --- ADMIN FUNCTIONS ---

// Get all wall messages (no limit, for admin dashboard)
export const getAllWallMessages = async () => {
    try {
        const q = query(
            collection(db, 'wall_messages'),
            orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date()
            };
        });
    } catch (error) {
        console.error("Error fetching all messages:", error);
        return [];
    }
};

// Delete a wall message
export const deleteWallMessage = async (messageId: string) => {
    try {
        await deleteDoc(doc(db, 'wall_messages', messageId));
        return { success: true };
    } catch (error) {
        console.error("Error deleting message:", error);
        return { success: false, error };
    }
};

// Update a wall message (e.g. moderate content)
export const updateWallMessage = async (messageId: string, newData: any) => {
    try {
        await updateDoc(doc(db, 'wall_messages', messageId), newData);
        return { success: true };
    } catch (error) {
        console.error("Error updating message:", error);
        return { success: false, error };
    }
};

export { db };
