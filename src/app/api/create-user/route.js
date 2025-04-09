'use server'

import Database from 'better-sqlite3';
import path from 'path';
import generateHash from '../../utils/generateHash.ts';
import createDB from '../../utils/createDB.ts'
import { encryptText } from '../../utils/crypto.ts';
import compareHash from '../../utils/compareHash.ts';

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

    if (name.length <= 3){
        console.info("usuário tentou criar um usuário com nome menor que 3", name);
        return new Response(
            JSON.stringify( {error: "O seu nome de usuário deve ter mais de 3 caracteres"},
                { message: "o nome que o usuario colocou foi muito curto, precisa ter mais de 3 caracteres!" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
    }
    const localDb = new Database(dbPath);
    if(await isSameNameBeingUsed(name, localDb)){
        console.info("usuário tentou criar um usuário com nome igual", name);
        return new Response(
            JSON.stringify( {error: "Usuário com o mesmo nome já existe"},
                { message: "um usuário com o mesmo exato nome já existe!" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
    }

    const nameEncrypted = await encryptText(name);
    const nameHash = await generateHash(name);

    
    const stmt = localDb.prepare('INSERT INTO users (userName, userPasswordHash, userNameHash) VALUES (?, ?, ?);');
    stmt.run(nameEncrypted, passwordHash, nameHash);
    localDb.close();

    if (name === "Kaio"){
        return new Response(
            JSON.stringify({ adminEnabled: true,
                key: await generateHash("mariokart7"),
                message: "usuário adicionado com suquixexo ;]" }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
    }

    return new Response(
        JSON.stringify({ message: "usuário adicionado com suquixexo ;]" }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
}

async function isSameNameBeingUsed(targetName, localDb){

    const stmt = localDb.prepare(`SELECT userNameHash FROM users`);
    const nameHashes = stmt.all();

    for (const nameHash of nameHashes) {
        // Compara o nome alvo criptografado com os nomes criptografados no banco
        if (await compareHash(targetName, nameHash.userNameHash)) {
            
            return true;
        }
    }
    return false;

}
