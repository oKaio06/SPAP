'use server'

import Database from 'better-sqlite3';
import path from 'path';
import generateHash from '../../utils/generateHash.ts';
import createDB from '../../utils/createDB.ts'
import { decryptText, encryptText } from '../../utils/crypto.ts';

export async function POST(req) {
    const dbPath = path.resolve(process.cwd(), 'users.db');

    createDB(dbPath);

    if(req.method != 'POST'){
        return new Response(
            JSON.stringify( {error: "Método de conexão não permitido"},
                { message: "Method not allowed, use POST!" }),
            { status: 405, headers: { 'Content-Type': 'application/json' } }
          );
    }
    const body = await req.json();
    
    const name = body.name;
    const passwordHash = await generateHash(body.password);

    if(await isSameNameBeingUsed(name, dbPath)){
        console.info("usuário tentou criar um usuário com nome igual", name);
        return new Response(
            JSON.stringify( {error: "Usuário com o mesmo nome já existe"},
                { message: "um usuário com o mesmo exato nome já existe!" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
    }

    const nameEncrypted = await encryptText(name);
    const nameHash = await generateHash(nameHash);

    const localDb = new Database(dbPath);
    const stmt = localDb.prepare('INSERT INTO users (userName, userPasswordHash, userNameHash) VALUES (?, ?, ?);');
    stmt.run(nameEncrypted, passwordHash, nameHash);
    localDb.close();
    
    return new Response(
        JSON.stringify({ message: "usuário adicionado com suquixexo ;]" }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
}

async function isSameNameBeingUsed(targetName, dbPath){
    const localDb = new Database(dbPath);
    try {
        const stmt = localDb.prepare(`SELECT userName FROM users`);
        const names = stmt.all();

        const encryptedTargetName = await encryptText(targetName); // Criptografa o nome alvo

        for (const nameEncrypted of names) {
            // Compara o nome alvo criptografado com os nomes criptografados no banco
            if (encryptedTargetName === nameEncrypted.userName) {
                localDb.close();
                return true;
            }
        }
        localDb.close();
        return false;
    } finally {
        localDb.close();
    }
}
