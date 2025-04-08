import crypto from "crypto";
const algoritmo = 'aes-256-cbc';
const chave = crypto.randomBytes(32); 

export default async function decryptText(encryptedText: string) {
    const [ivHex, data] = encryptedText.split(':');
    const ivFromText = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algoritmo, chave, ivFromText);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }