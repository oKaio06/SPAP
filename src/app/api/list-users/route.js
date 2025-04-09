'use server'

import Database from 'better-sqlite3';
import path from 'path';
import createDB from '../../utils/createDB.ts'
import { decryptText } from '../../utils/crypto.ts';

export async function GET(req) {
    const dbPath = path.resolve(process.cwd(), 'users.db');

    createDB(dbPath);

    if(req.method != 'GET'){
        return new Response(
            JSON.stringify( {error: "Método de conexão não permitido"},
                { message: "Method not allowed, use GET!" }),
            { status: 405, headers: { 'Content-Type': 'application/json' } }
          );
    }

    const localDb = new Database(dbPath);
    let usersEncrypted = localDb.prepare('SELECT userName FROM users;').all();
    let usersDecrypted = [];

    for(const user of usersEncrypted){
        const decryptedName = await decryptText(user.userName);
        usersDecrypted.push(decryptedName);
    }
    localDb.close();
    
    return new Response(
        JSON.stringify({ users: usersDecrypted,
            message: "usuários listados" }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
}
