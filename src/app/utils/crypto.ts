import crypto from 'crypto';

const algoritmo = 'aes-256-cbc';
const chaveString = 'AGa4e56aWG43waghpoe4j4ABCDEFGH12'; 
const chave = Buffer.from(chaveString, 'utf-8');

export async function decryptText(encryptedText: string) {
    try {
        const [ivHex, data] = encryptedText.split(':');
        const ivFromText = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(algoritmo, chave, ivFromText);
        let decrypted = decipher.update(data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error("Erro ao descriptografar:", error);
        return null;
    }
}

export async function encryptText(text: string) {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algoritmo, chave, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
        console.error("Erro ao encriptografar:", error);
        return null;
    }
}