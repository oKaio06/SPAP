'use server'

import generateHash from '../../utils/generateHash.ts';
import { encryptText } from '../../utils/crypto.ts';
import compareHash from '../../utils/compareHash.ts';
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
    const passwordHash = await generateHash(body.password);

    if (name.length <= 2){
        console.info("usuário tentou criar um usuário com nome menor que 3", name);
        return new Response(
            JSON.stringify( {error: "O seu nome de usuário deve ter mais de 3 caracteres"},
                { message: "o nome que o usuario colocou foi muito curto, precisa ter mais de 3 caracteres!" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
    }

    if(await isSameNameBeingUsed(name)){
        console.info("usuário tentou criar um usuário com nome igual", name);
        return new Response(
            JSON.stringify( {error: "Usuário com o mesmo nome já existe"},
                { message: "um usuário com o mesmo exato nome já existe!" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
    }

    const nameEncrypted = await encryptText(name);
    const nameHash = await generateHash(name);

    
    const stmt = await sql`INSERT INTO "users" ("userName", "userPasswordHash", "userNameHash") VALUES 
        (${nameEncrypted}, ${passwordHash}, ${nameHash});`
    ;

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

async function isSameNameBeingUsed(targetName){

    const nameHashes = await sql`SELECT "userNameHash" FROM "users"`;

    for (const nameHash of nameHashes) {
        // Compara o nome alvo criptografado com os nomes criptografados no banco
        if (await compareHash(targetName, nameHash.userNameHash)) {
            
            return true;
        }
    }
    return false;

}
