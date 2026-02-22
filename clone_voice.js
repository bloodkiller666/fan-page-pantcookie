const fs = require('fs');
const path = require('path');
const https = require('https');

// --- CONFIGURACIÓN ---
// 1. Pon tu API Key de MiniMax aquí o usa variable de entorno MINIMAX_API_KEY
const API_KEY = process.env.MINIMAX_API_KEY || "TU_API_KEY_AQUI";

// 2. Ruta al archivo de audio (mp3, wav, m4a). Debe durar entre 10s y 5min.
const AUDIO_FILE_PATH = process.argv[2] || "tu_archivo_de_audio.mp3"; 

// 3. Nombre para tu voz personalizada
const VOICE_NAME = "MiVozClonada_" + Date.now();

// ----------------------

if (!API_KEY || API_KEY === "TU_API_KEY_AQUI") {
    console.error("❌ ERROR: Necesitas una API Key de MiniMax.");
    console.log("Uso: set MINIMAX_API_KEY=tu_key && node clone_voice.js ruta/al/audio.mp3");
    process.exit(1);
}

if (!fs.existsSync(AUDIO_FILE_PATH)) {
    console.error(`❌ ERROR: No se encuentra el archivo de audio: ${AUDIO_FILE_PATH}`);
    console.log("Por favor, proporciona la ruta a un archivo de audio válido.");
    process.exit(1);
}

console.log(`🎙️  Procesando archivo: ${AUDIO_FILE_PATH}`);
console.log(`🔑 Usando API Key: ${API_KEY.substring(0, 6)}...`);

// Función auxiliar para hacer peticiones HTTPS
function makeRequest(options, postData, isMultipart = false) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject({ statusCode: res.statusCode, body: parsed });
                    }
                } catch (e) {
                    reject({ statusCode: res.statusCode, body: data, error: e });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function run() {
    try {
        // PASO 1: Subir Archivo
        console.log("\n1️⃣  Subiendo archivo de audio a MiniMax...");
        
        const boundary = '----MiniMaxBoundary' + Date.now();
        const fileContent = fs.readFileSync(AUDIO_FILE_PATH);
        const fileName = path.basename(AUDIO_FILE_PATH);
        
        let body = Buffer.concat([
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="purpose"\r\n\r\nvoice_clone\r\n`),
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`),
            fileContent,
            Buffer.from(`\r\n--${boundary}--\r\n`)
        ]);

        const uploadResponse = await makeRequest({
            hostname: 'api.minimax.io',
            path: '/v1/files/upload',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length
            }
        }, body);

        if (!uploadResponse.file || !uploadResponse.file.file_id) {
            throw new Error("Respuesta de subida inválida: " + JSON.stringify(uploadResponse));
        }

        const fileId = uploadResponse.file.file_id;
        console.log(`✅ Archivo subido con éxito. File ID: ${fileId}`);

        // PASO 2: Clonar Voz
        console.log("\n2️⃣  Creando clon de voz...");
        
        const clonePayload = JSON.stringify({
            file_id: fileId,
            voice_id: VOICE_NAME
        });

        const cloneResponse = await makeRequest({
            hostname: 'api.minimax.io',
            path: '/v1/voice_clone',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(clonePayload)
            }
        }, clonePayload);

        console.log("\n🎉 ¡ÉXITO! Voz clonada correctamente.");
        console.log("------------------------------------------------");
        console.log(`🆔 TU VOICE ID: ${cloneResponse.voice_id || VOICE_NAME}`); // A veces devuelven el mismo ID que enviaste
        console.log("------------------------------------------------");
        console.log("\n👉 Ahora, para usar esta voz en tu Chatbot:");
        console.log("1. Copia el VOICE ID de arriba.");
        console.log("2. Pídele al asistente: 'Integra el Voice ID [TU_ID] en el Chatbot'.");

    } catch (error) {
        console.error("\n❌ ERROR en el proceso:");
        console.error(error);
    }
}

run();
