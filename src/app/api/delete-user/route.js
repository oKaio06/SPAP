'use server'

import compareHash from '../../utils/compareHash.ts'
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {

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

    
    const nameEncrypted = await getUserEncryptedByName(name);

    const deleteResponse = await sql`DELETE FROM "users" WHERE "userName" = ${nameEncrypted};`;
    console.log(`Resposta ao deletar ${name} (${nameEncrypted}): ${deleteResponse.changes}`);
    
    return new Response(
        JSON.stringify({ message: "usuário removido" }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
}

async function getUserEncryptedByName(targetName){
    
    const users = await sql`SELECT u."userNameHash", u."userName" FROM "users" u`;
    
    for(const user of users){
        if(await compareHash(targetName, user.userNameHash)){
            return user.userName;
        }
    }

    return null;
}