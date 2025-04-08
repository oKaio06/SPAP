import bcrypt from 'bcrypt';

export default async function compareHash(text:string, hash:string): Promise<boolean>{
    return await bcrypt.compare(text, hash);
}