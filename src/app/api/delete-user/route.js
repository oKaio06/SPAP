'use server'

import Database from 'better-sqlite3';
import path from 'path';
import createDB from '../../utils/createDB.ts'
import { encryptText } from '../../utils/crypto.ts';
import compareHash from '../../utils/compareHash.ts'

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
    const adminKeyHash = body.key;

    if(!await compareHash("mariokart7", adminKeyHash)){
        return new Response(
            JSON.stringify( {error: "Chave admin inválida!"},
                { message: "usuario tentou executar delete com chave de admin invalida" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
    }

    
    const localDb = new Database(dbPath);
    const nameEncrypted = await getUserEncryptedByName(name, localDb);
    
    const deleteResponse = localDb.prepare('DELETE FROM users WHERE userName = ?;').run(nameEncrypted);
    console.log(`Resposta ao deletar ${name} (${nameEncrypted}): ${deleteResponse.changes}`);
    localDb.close();
    
    return new Response(
        JSON.stringify({ message: "usuário removido" }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
}

async function getUserEncryptedByName(targetName, localDb){
    
    const stmt = localDb.prepare(`SELECT userNameHash, userName FROM users`);
    const users = stmt.all();
    
    for(const user of users){
        if(await compareHash(targetName, user.userNameHash)){
            return user.userName;
        }
    }

    return null;
}