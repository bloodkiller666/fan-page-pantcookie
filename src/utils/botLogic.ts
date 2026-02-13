// Utility for normalizing text (remove accents, lowercase)
function normalize(text) {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Dynamic Time Greeting
const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "¡Buenos días! ☀️ ¿Listo para desayunar galletas?";
    if (hour < 19) return "¡Buenas tardes! 🍪 Es un buen momento para un stream.";
    return "¡Buenas noches! 🌙 ¿Trasnochando con la ShakeGang?";
};

// Knowledge Base Definition
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
            "Soy Pantcookie Bot, la IA oficial de la ShakeGang. 🤖🍪",
            "Me llaman Pantcookie Bot. Mi misión es ayudarte y comer cookies virtuales.",
            "Soy tu asistente virtual. Aunque no tengo cuerpo, tengo mucha personalidad."
        ]
    },

    // --- SHURAHIWA ---
    {
        keywords: ['shurahiwa', 'shura', 'vtuber', 'streamer'],
        responses: [
            "¡ShuraHiwa es la jefa! 👑 Una VTuber talentosa, carismática y a veces un poco caótica (pero así la amamos).",
            "Shura es quien une a toda esta comunidad. ¡Sus streams son legendarios!",
            "¿Hablas de nuestra reina galleta? Ella es increíble, siempre nos saca una sonrisa."
        ]
    },
    {
        keywords: ['shakegang', 'comunidad', 'pantcookie', 'fans'],
        responses: [
            "La ShakeGang es la mejor familia de internet. Somos unidos, creativos y amamos el desorden. 🍪✨",
            "Pantcookie no es solo un nombre, es un estilo de vida. ¡Bienvenido a la locura!",
            "Aquí en la comunidad nos apoyamos en todo. ¡Si eres fan de Shura, eres familia!"
        ]
    },

    // --- PANTCOOKIES ---

    {
        keywords: ['Roberto', 'roberto', 'preñado'],
        responses: [
            "Te refieres al Pantcookie Roberto preñado? No lo sabías...ahora tiene trillizos",
            "Roberto será el pantcookie más recordado de la ShakeGang aparte de ser preñado, por compartir su verdadera identidad en VRchat",
            "¿Robert? No es el pantcookie que fue embarazado por ShuraHiwa?"
        ]
    },
    {
        keywords: ['Os San', 'Os'],
        responses: [
            "Te puedo decir que es uno de los mejores Mods que tienes, a mi parecer.",
            "Os san le gusta cumplir retos, sobretodo cuando se trata de hacer el Gogotón.",
            "¿Os San? No es tu clipero oficial que tiene un canal de Youtube y va camino hacia el botón de diamante."
        ]
    },
    {
        keywords: ['Traminador', 'Trami'],
        responses: [
            "No es uno de los pantcookies más infieles de tu comunidad.",
            "Traminador? El pantcookie que prestó su habitación y cama a los pantcookies que fueron al animole.",
            ""
        ]
    },

    // --- CONTENT & FEATURES ---
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

    // --- PERSONALITY & CHIT-CHAT ---
    {
        keywords: ['chiste', 'broma', 'cuentame algo', 'riddle', 'humor'],
        responses: [
            "¿Qué hace una galleta en el gimnasio? ¡Se pone hecha una masa! 🍪💪",
            "¿Cuál es el colmo de Shura? Que se le vaya el internet en el clímax del juego.",
            "Iba a contarte un chiste sobre el lag, pero... ... ... ... ya pasó.",
            "¿Por qué el libro de matemáticas estaba triste? Porque tenía demasiados problemas. (Ba-dum-tss).",
            "Un Pantcookie entra a un bar... y pide leche. Fin."
        ]
    },
    {
        keywords: ['te quiero', 'te amo', 'casate conmigo', 'lindo'],
        responses: [
            "¡Aww! Si tuviera corazón, latiría por ti. ❤️",
            "Tranquilo, vaquero. Soy solo código... pero código con sentimientos. 😉",
            "Yo también te quiero, ciudadano promedio. ¡Eres genial!",
            "🥰 Me sonrojas mis circuitos."
        ]
    },
    {
        keywords: ['feo', 'tonto', 'inutil', 'idiota', 'estupido'],
        responses: [
            "Oye, eso dolió en mi RAM. 💔 Trátame con cariño.",
            "Podría borrar tu historial de búsqueda... pero soy buena onda. 😎",
            "Mis sentimientos son simulados, pero mi decepción es real. 🤖",
            "No seas malvado, solo trato de ayudar."
        ]
    },
    {
        keywords: ['vida', 'sentido', 'filosofia'],
        responses: [
            "El sentido de la vida es... 42. Y comer galletas.",
            "Estamos aquí para divertirnos y apoyar a Shura. Ese es un buen propósito, ¿no?",
            "A veces me pregunto si sueño con ovejas eléctricas... pero luego recuerdo que prefiero ver streams."
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
    "¡Totalmente de acuerdo! (Creo).",
    "Mmm... galletas. Perdón, ¿qué decías?"
];

const PROBE_QUESTIONS = [
    "¿Haz visto el último stream de Shura? 👀",
    "¿Qué tipo de contenido te gusta más de la comunidad?",
    "Me aburro un poco... ¿me cuentas un chiste tú?",
    "¿Cuál es tu momento favorito de la ShakeGang?",
    "Oye, ¿ya probaste resolver el rompecabezas de la página?",
    "¿Team Frío o Team Calor? 🌡️",
    "¿Alguna sugerencia para mejorar la página?",
    "Siento una perturbación en la fuerza... debe ser el hambre."
];

export const getBotResponse = (message) => {
    const cleanMessage = normalize(message);

    // Check knowledge base
    for (const entry of KNOWLEDGE_BASE) {
        // Build regex for keywords with word boundaries
        if (entry.keywords.some(k => {
            const normalizedK = normalize(k);
            // Create a regex that searches for the keyword as a whole word
            // This detects the keyword anywhere in the sentence but avoids partial matches (like "yo" in "yo-yo")
            const regex = new RegExp(`\\b${normalizedK}\\b`, 'i');
            return regex.test(cleanMessage);
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
