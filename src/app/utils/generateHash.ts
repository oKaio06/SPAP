import bcrypt from 'bcrypt';

export default async function generateHash(text:string): Promise<string> {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(text, salt);
}
