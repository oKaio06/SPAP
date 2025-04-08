import crypto from 'crypto';

const algoritmo = 'aes-256-cbc';

export async function decryptText(encryptedText: string, key: string) {
    try {
        const [ivHex, data] = encryptedText.split(':');
        const ivFromText = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(algoritmo, key, ivFromText);
        let decrypted = decipher.update(data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error("Erro ao descriptografar:", error);
        return null;
    }
}

export async function encryptText(text: string, key: string) {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algoritmo, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
        console.error("Erro ao encriptografar:", error);
        return null;
    }
}