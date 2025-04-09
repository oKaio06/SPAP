'use server'

import compareHash from '../../utils/compareHash.ts';
import { decryptText } from '../../utils/crypto.ts';
import generateHash from '../../utils/generateHash.ts';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {

    if(req.method != 'POST'){
        return new Response(
            JSON.stringify({error: "Método inválido, use POST",
                 message: "não foi possível iniciar a conexão, método inválido" }),
            { status: 405, headers: { 'Content-Type': 'application/json' } }
          );
    }
    const body = await req.json();
    const {name, password} = body;


    const usersIdsResult = await sql`SELECT "userId" FROM "users"`;
    const usersIds = usersIdsResult.map(row => row.userId);

    if (usersIds.length < 7){
        if (name === "Kaio"){
            return new Response(
                JSON.stringify({ adminEnabled: true,
                    key: await generateHash("mariokart7"),
                    message: "usuário adicionado com suquixexo ;]" }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
              );
        }
        return new Response(
            JSON.stringify({error: "Usuários insuficientes, aguarde até que 7 pessoas entrem",
                 message: "não foi possível checar o amigo secreto, usuário insuficientes" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
    }

    const nameEncrypted = await getUserEncryptedByName(name);

    if (nameEncrypted == null){
        return new Response(
            JSON.stringify({error: "Usuário não encontrado",
                 message: "não foi possível encontrar o usuário solicitado" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
    }

    const userInfo = await sql`
        SELECT "userId", "userName", "userPasswordHash" 
        FROM "users"
        WHERE "userName" = ${nameEncrypted};`
    ;

    let dbUserId, dbUserNameEncrypted, dbUserPassHash;

    if (userInfo.length > 0 || userInfo[0]) {
        dbUserId = userInfo[0].userId;
        dbUserNameEncrypted = userInfo[0].userName;
        dbUserPassHash = userInfo[0].userPasswordHash;
    }    
    else{
        return new Response(
            JSON.stringify({error: "Usuário não encontrado",
                 message: "não foi possível encontrar o usuário solicitado" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
    }

    const dbUserNameDecrypted = await decryptText(dbUserNameEncrypted);

    if(await compareHash(password, dbUserPassHash)){
        const connectResult = await connectUserToOtherUser(dbUserId);
        switch (connectResult){
            case 0:
                console.info(`usuario ${dbUserNameDecrypted} já está conectado a um outro usuario, obtendo usuario...`);
                break;
            case 1:
                console.info(`usuario ${dbUserNameDecrypted} foi conectado a outro usuario com sucesso`);
                break;
            case 2:
                return new Response(
                    JSON.stringify({error: "Sem usuários para se conectar",
                         message: `não foi possivel conectar o usuário ${dbUserNameDecrypted} a outro usuário, sem usuários disponíveis` }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                  );
        }

        const secretFriendQuery = await sql`
            SELECT u."userName" AS "associatedUserName"
            FROM "secret_friend_assignments" sfa
            JOIN "users" u ON sfa."receiverId" = u."userId"
            WHERE sfa."giverId" = ${dbUserId}`
        ;

        let secretFriend = await decryptText(secretFriendQuery[0].associatedUserName);

        if (name === "Kaio"){
            return new Response(
                JSON.stringify({ secretFriend: secretFriend,
                    adminEnabled: true,
                    key: await generateHash("mariokart7"),
                    message: "usuário adicionado com suquixexo ;]" }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
              );
        }

        return new Response(
            JSON.stringify({secretFriend: secretFriend,
                 message: "amigo secreto obtido com sucesso" }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
    }
    else{
        return new Response(
            JSON.stringify({error: "Senha inválida",
                 message: "usuário tentou entrar com a senha errada ;]" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
    }
    
}

async function connectUserToOtherUser(userId){
    if(await isUserConnected(userId)){
        return 0;
    }

    const availableUsersResult = await sql`
        SELECT "userId" from "users"
        WHERE "userId" <> ${userId}
        AND "userId" NOT IN (
        SELECT "receiverId" FROM "secret_friend_assignments")`
        ;

    const availableUserIds = availableUsersResult.map(row => row.userId);

    if (availableUserIds.length === 0) {
      return 2;
    }

    const randomIndex = Math.floor(Math.random() * availableUserIds.length);
    const receiverUserId = availableUserIds[randomIndex];

    await sql`
      INSERT INTO "secret_friend_assignments" ("giverId", "receiverId")
      VALUES (${userId}, ${receiverUserId})`
      ;

    return 1;
}

async function isUserConnected(userId){
    const alreadyAssigned = await sql`
        SELECT 1 FROM "secret_friend_assignments"
        WHERE "giverId" = ${userId} LIMIT 1`;
    return alreadyAssigned.length > 0;
}

async function getUserEncryptedByName(targetName){
    
    const users = await sql`SELECT "userNameHash", "userName" FROM "users"`;
    
    for(const user of users){
        if(await compareHash(targetName, user.userNameHash)){
            return user.userName;
        }
    }

    return null;
}