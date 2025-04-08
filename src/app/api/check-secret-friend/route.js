'use server'

import Database from 'better-sqlite3';
import path from 'path'
import compareHash from '../../utils/compareHash.ts';
import createDB from '../../utils/createDB.ts'
import { decryptText } from '../../utils/crypto.ts';

export async function POST(req) {
    const dbPath = path.resolve(process.cwd(), 'users.db');

    createDB(dbPath);

    if(req.method != 'POST'){
        return new Response(
            JSON.stringify({error: "Método inválido, use POST",
                 message: "não foi possível iniciar a conexão, método inválido" }),
            { status: 405, headers: { 'Content-Type': 'application/json' } }
          );
    }
    const body = await req.json();

    const {name, password} = body;

    const localDb = new Database(dbPath);

    const usersIdsResult = localDb.prepare('SELECT userId FROM users').all();
    const usersIds = usersIdsResult.map(row => row.userId);

    if (usersIds.length < 7){
        localDb.close();
        return new Response(
            JSON.stringify({error: "Usuários insuficientes, aguarde até que 7 pessoas entrem",
                 message: "não foi possível checar o amigo secreto, usuário insuficientes" }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
    }

    const nameEncrypted = await getUserEncryptedByName(name, dbPath);

    if (nameEncrypted == null){
        localDb.close();
        return new Response(
            JSON.stringify({error: "Usuário não encontrado",
                 message: "não foi possível encontrar o usuário solicitado" }),
            { status: 402, headers: { 'Content-Type': 'application/json' } }
          );
    }

    const stmt1 = localDb.prepare(`
        SELECT userId, userName, userPasswordHash 
        FROM users
        WHERE userName == ?;`
    );

    const userInfo = stmt1.get(nameEncrypted);
    let dbUserId, dbUserNameEncrypted, dbUserPassHash;
    console.info(userInfo);

    if (userInfo) {
        dbUserId = userInfo.userId;
        dbUserNameEncrypted = userInfo.userName;
        dbUserPassHash = userInfo.userPasswordHash;
    }    
    else{
        localDb.close();
        return new Response(
            JSON.stringify({error: "Usuário não encontrado",
                 message: "não foi possível encontrar o usuário solicitado" }),
            { status: 402, headers: { 'Content-Type': 'application/json' } }
          );
    }

    const dbUserNameDecrypted = await decryptText(dbUserNameEncrypted, dbUserPassHash);

    if(await compareHash(password, dbUserPassHash)){
        const connectResult = connectUserToOtherUser(dbUserId, dbPath);
        switch (connectResult){
            case 0:
                console.info(`usuario ${dbUserNameDecrypted} já está conectado a um outro usuario, obtendo usuario...`);
                break;
            case 1:
                console.info(`usuario ${dbUserNameDecrypted} foi conectado a outro usuario com sucesso`);
                break;
            case 2:
                localDb.close();
                return new Response(
                    JSON.stringify({error: "Sem usuários para se conectar",
                         message: `não foi possivel conectar o usuário ${dbUserNameDecrypted} a outro usuário, sem usuários disponíveis` }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                  );
        }

        const stmt2 = localDb.prepare(
            `SELECT u2.userName AS associatedUserName
            FROM user_associations ua
            JOIN users u1 ON ua.user1Id = u1.userId
            JOIN users u2 ON ua.user2Id = u2.userId
            WHERE u1.userId = ?

            UNION

            SELECT u1.userName AS associatedUserName
            FROM user_associations ua
            JOIN users u1 ON ua.user1Id = u1.userId
            JOIN users u2 ON ua.user2Id = u2.userId
            WHERE u2.userId = ?;`
        );
        let secretFriend = stmt2.get(dbUserId, dbUserId);

        secretFriend = await decryptText(secretFriend.associatedUserName);

        console.log(secretFriend);

        localDb.close();
            
        return new Response(
            JSON.stringify({secretFriend: secretFriend,
                 message: "amigo secreto obtido com sucesso" }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
    }
    else{
        localDb.close();
        return new Response(
            JSON.stringify({error: "Senha inválida",
                 message: "usuário tentou entrar com a senha errada ;]" }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
    }
    
}

function connectUserToOtherUser(userId, dbPath){
    if(isUserConnected(userId, dbPath)){
        return 0;
    }

    const localdb = new Database(dbPath);

    const stmt = localdb.prepare(
        `SELECT user1Id AS connectedId FROM user_associations
        UNION
        SELECT user2Id FROM user_associations`
    );
    const connectedUserIdsResult = stmt.all();
    console.log(connectedUserIdsResult);
    const connectedUserIds = new Set(connectedUserIdsResult.map(row => row.connectedId));
    connectedUserIds.add(userId); 

    const availableUsersResult = localdb.prepare('SELECT userId FROM users WHERE userId != ?').all(userId);

    const availableUserIds = availableUsersResult
      .map(row => row.userId)
      .filter(userId => !connectedUserIds.has(userId));

    if (availableUserIds.length === 0) {
      return 2;
    }

    const randomIndex = Math.floor(Math.random() * availableUserIds.length);
    const otherUserId = availableUserIds[randomIndex];

    const sortedPair = [userId, otherUserId].sort((a, b) => a - b);
    localdb.prepare(`
      INSERT INTO user_associations (user1Id, user2Id)
      VALUES (?, ?)
    `).run(sortedPair[0], sortedPair[1]);

    localdb.close();

    return 1;
}

function isUserConnected(userId, dbPath){
    const localdb = new Database(dbPath);

    const isConnected = localdb.prepare(
        `SELECT 1 FROM user_associations 
        WHERE user1Id = ? OR user2Id = ?`
    ).get(userId, userId);
    
    localdb.close();
    return isConnected;
}

async function getUserEncryptedByName(targetName, dbPath){
    const localDb = new Database(dbPath);
    
    const stmt = localDb.prepare(`SELECT userNameHash, userName FROM users`);
    const users = stmt.all();
    
    for(const user of users){
        if(await compareHash(targetName, user.userNameHash)){
            localDb.close();
            return user.userName;
        }
    }

    return null;
}