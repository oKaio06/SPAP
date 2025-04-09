'use server'

import { decryptText } from '../../utils/crypto.ts';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {

    if(req.method != 'GET'){
        return new Response(
            JSON.stringify( {error: "Método de conexão não permitido"},
                { message: "Method not allowed, use GET!" }),
            { status: 405, headers: { 'Content-Type': 'application/json' } }
          );
    }

    let usersEncrypted = await sql`SELECT "userName" FROM "users" ;`;
    let usersDecrypted = [];

    for(const user of usersEncrypted){
        const decryptedName = await decryptText(user.userName);
        usersDecrypted.push(decryptedName);
    }
    
    return new Response(
        JSON.stringify({ users: usersDecrypted,
            message: "usuários listados" }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
}
