import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getIP, rateLimit } from "@/utils/rateLimit";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

export async function POST(request: Request) {
    if (!rateLimit(`upload:${getIP(request)}`, 5, 60_000).success) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    try {
        const file = (await request.formData()).get("file");

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }
        const ext = ALLOWED_TYPES[file.type];
        if (!ext) {
            return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
        }
        if (file.size > MAX_BYTES) {
            return NextResponse.json({ error: "File too large" }, { status: 413 });
        }

        // Never trust the client-provided name: use a random key and the validated extension.
        const key = `wall/${randomUUID()}.${ext}`;

        await r2.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: Buffer.from(await file.arrayBuffer()),
            ContentType: file.type,
        }));

        return NextResponse.json({ success: true, url: `${process.env.R2_PUBLIC_DOMAIN}/${key}` });
    } catch (error) {
        console.error("R2 Upload Error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
