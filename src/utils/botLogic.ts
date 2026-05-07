// Utility for normalizing text (remove accents, lowercase)
import knowledgeData from '../data/botKnowledge.json';

function normalize(text: string) {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Dynamic Time Greeting
const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "¡Buenos días! ☀️ ¿Listo para desayunar galletas?";
    if (hour < 19) return "¡Buenas tardes! 🍪 Es un buen momento para un stream.";
    return "¡Buenas noches! 🌙 ¿Trasnochando con la ShakeGang?";
};

// --- TRANSFORM JSON KNOWLEDGE BASE ---
// We transform the JSON structure into a more usable format for matching
const KNOWLEDGE_BASE = [
    // --- GREETINGS & BASICS ---
    {
        keywords: ['hola', 'buenas', 'hey', 'hello', 'que tal', 'como estas', 'hi', 'holis'],
        responses: [
            () => getTimeGreeting(),
            "¡Holi! 🍪 ¿Qué cuenta la galleta?",
            "¡Qué milagro verte por aquí! ¿Trajiste leche para acompañar?",
            "¡Hola, hola! Soy todo oídos (y chispas de chocolate)."
        ]
    },
    {
        keywords: ['adios', 'bye', 'chao', 'nos vemos', 'hasta luego', 'me voy'],
        responses: ["EXIT"] // Special signal handled by UI
    },
    {
        keywords: ['gracias', 'te agradezco', 'thx', 'ty'],
        responses: [
            "¡De nada! Aquí estamos para servir. 🍪",
            "No hay de qué, para eso soy tu asistente favorito.",
            "¡Con gusto! ¿Te puedo ayudar en algo más?",
            "A ti por ser parte de la ShakeGang."
        ]
    },
    {
        keywords: ['Shake', 'Shakeee', 'Shakeeeeee', 'Shakeeeeeeeeee'],
        responses: [
            "Gang",
            "Gaaaaang",
            "Gaaaaaaaaang",
        ]
    },
    {
        keywords: ['quien eres', 'tu nombre', 'como te llamas', 'que eres'],
        responses: [
            `Soy pantcake IA, la inteligencia artificial de la ShakeGang.`,
            "Me llaman pantcake IA. Mi misión es ser tu compañero de chat y comer cookies virtuales (procesar datos).",
            `Soy una IA entrenada para la ShakeGang. ${knowledgeData.bot.role}`
        ]
    },
    // --- DYNAMIC CONTENT FROM JSON ---
    // SHURA
    {
        keywords: ['shura', 'shurahiwa', 'vtuber'],
        responses: [
            `ShuraHiwa es una VTuber increíble. ${knowledgeData.shura.bio}`,
            `A Shura le gusta: ${knowledgeData.shura.likes.slice(0, 3).join(', ')} y más.`,
            `Cuidado con lo que le das, odia: ${knowledgeData.shura.dislikes.slice(0, 3).join(', ')}.`
        ]
    },
    // pantcakes (Dynamic generation)
    ...knowledgeData.pantcakes.map(pc => ({
        keywords: [pc.n, normalize(pc.n)],
        responses: [
            `${pc.n}: ${pc.i}`,
            `¿Preguntas por ${pc.n}? ${pc.i}`
        ]
    })),
    // GLOSSARY (Dynamic generation)
    ...knowledgeData.glossary.map(term => ({
        keywords: [term.t, normalize(term.t)],
        responses: [
            `${term.t}: ${term.d}`,
            `Aquí tienes la info sobre ${term.t}: ${term.d}`
        ]
    })),

    // --- STATIC FALLBACKS / EXTRAS ---
    {
        keywords: ['discord', 'unirme', 'servidor', 'chat'],
        responses: [
            "¡Únete al Discord! Ahí es donde ocurre la verdadera fiesta. 🎉 Busca el enlace en la sección 'Sobre Nosotros'.",
            "El Discord de la ShakeGang siempre está activo. ¡Te esperamos allá!",
            "Si quieres chismes, memes y amigos, corre a nuestro Discord."
        ]
    },
    {
        keywords: ['juego', 'game', 'rompecabezas', 'jugar'],
        responses: [
            "¡Tenemos un Rompecabezas genial en la sección de Juegos! 🧩 ¿Ya lograste armarlo?",
            "Si estás aburrido, ve a la pestaña 'Juegos'. ¡Te reto a superar el tiempo récord!",
            "El minijuego es adictivo. Ten cuidado o perderás la tarde entera. (Hablo por experiencia... simulada)."
        ]
    },
    {
        keywords: ['foto', 'imagen', 'galeria', 'meme'],
        responses: [
            "Nuestra Galería está llena de joyas. Desde fanarts épicos hasta memes cuestionables. 🎨",
            "¡Checa la sección Multimedia! Los artistas de la ShakeGang tienen mucho talento.",
            "¿Buscas fondos de pantalla? La galería tiene lo que necesitas."
        ]
    },
    {
        keywords: ['chiste', 'broma', 'cuentame algo', 'riddle', 'humor'],
        responses: [
            "¿Qué hace una galleta en el gimnasio? ¡Se pone hecha una masa! 🍪💪",
            "¿Cuál es el colmo de Shura? Que se le vaya el internet en el clímax del juego.",
            "Iba a contarte un chiste sobre el lag, pero... ... ... ... ya pasó.",
            "¿Por qué el libro de matemáticas estaba triste? Porque tenía demasiados problemas. (Ba-dum-tss).",
            "Un pantcake entra a un bar... y pide leche. Fin."
        ]
    },
    {
        keywords: ['hora', 'tiempo', 'que hora es'],
        responses: [
            () => `Son las ${new Date().toLocaleTimeString()}. Hora de ver si Shura está en vivo.`,
            "El tiempo es relativo, especialmente cuando ves un stream de 4 horas que se sienten como 10 minutos."
        ]
    }
];

const DEFAULT_RESPONSES = [
    "¡Eso suena interesante! Cuéntame más. 🤔",
    "No estoy seguro de entender al 100%, pero asiento virtualmente. 🤖",
    "Jaja, ¡qué locura! La ShakeGang nunca deja de sorprenderme.",
    "¿Y qué piensas tú de eso?",
    "A veces me pierdo en la conversación, ¡mi procesador es humilde! 😅",
    "Oye, cambiando de tema... ¿ya tomaste agua hoy? 🥤",
    "Esa es una buena pregunta. Déjame consultarlo con la almohada (el servidor).",
    "Mmm... galletas. Perdón, ¿qué decías?"
];

// Use openers from JSON
const PROBE_QUESTIONS = [
    ...knowledgeData.conversation.openers,
    "¿Haz visto el último stream de Shura? 👀",
    "¿Qué tipo de contenido te gusta más de la comunidad?",
    "Me aburro un poco... ¿me cuentas un chiste tú?",
    "¿Cuál es tu momento favorito de la ShakeGang?",
    "Oye, ¿ya probaste resolver el rompecabezas de la página?",
    "¿Team Frío o Team Calor? 🌡️",
    "¿Alguna sugerencia para mejorar la página?",
    "Siento una perturbación en la fuerza... debe ser el hambre."
];

export const getBotResponse = (message: string) => {
    const cleanMessage = normalize(message);

    // Check knowledge base
    for (const entry of KNOWLEDGE_BASE) {
        // Build regex for keywords with word boundaries
        if (entry.keywords.some(k => {
            const normalizedK = normalize(k);
            // Create a regex that searches for the keyword as a whole word
            // This detects the keyword anywhere in the sentence but avoids partial matches (like "yo" in "yo-yo")
            try {
                const regex = new RegExp(`\\b${normalizedK}\\b`, 'i');
                return regex.test(cleanMessage);
            } catch (e) {
                // Fallback for simple includes if regex fails (e.g. special chars)
                return cleanMessage.includes(normalizedK);
            }
        })) {
            // Select random response from match
            const response = entry.responses[Math.floor(Math.random() * entry.responses.length)];
            // Handle function responses (dynamic content)
            return typeof response === 'function' ? response() : response;
        }
    }

    // Default random response
    return DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
};

export const getProbeMessage = () => {
    return PROBE_QUESTIONS[Math.floor(Math.random() * PROBE_QUESTIONS.length)];
};
