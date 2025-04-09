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
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
    }

    const nameEncrypted = await getUserEncryptedByName(name, dbPath);

    if (nameEncrypted == null){
        localDb.close();
        return new Response(
            JSON.stringify({error: "Usuário não encontrado",
                 message: "não foi possível encontrar o usuário solicitado" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
    }

    const stmt1 = localDb.prepare(`
        SELECT userId, userName, userPasswordHash 
        FROM users
        WHERE userName == ?;`
    );

    const userInfo = stmt1.get(nameEncrypted);
    let dbUserId, dbUserNameEncrypted, dbUserPassHash;

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
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
    }

    const dbUserNameDecrypted = await decryptText(dbUserNameEncrypted);

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
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                  );
        }

        const secretFriendQuery = localDb.prepare(
            `SELECT u.userName AS associatedUserName
            FROM secret_friend_assignments sfa
            JOIN users u ON sfa.receiverId = u.userId
            WHERE sfa.giverId = ?`
        ).get(dbUserId);
        
        let secretFriend = await decryptText(secretFriendQuery.associatedUserName);

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
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
    }
    
}

function connectUserToOtherUser(userId, dbPath){
    if(isUserConnected(userId, dbPath)){
        return 0;
    }

    const localdb = new Database(dbPath);

    const availableUsersResult = localdb.prepare(`
        SELECT userId from users
        WHERE userId <> ?
        AND userId NOT IN (
        SELECT receiverId FROM secret_friend_assignments
        )`).all(userId);

    const availableUserIds = availableUsersResult.map(row => row.userId);

    if (availableUserIds.length === 0) {
      return 2;
    }

    const randomIndex = Math.floor(Math.random() * availableUserIds.length);
    const receiverUserId = availableUserIds[randomIndex];

    localdb.prepare(`
      INSERT INTO secret_friend_assignments (giverId, receiverId)
      VALUES (?, ?)
    `).run(userId, receiverUserId);

    localdb.close();

    return 1;
}

function isUserConnected(userId, dbPath){
    const localdb = new Database(dbPath);

    const alreadyAssigned = localdb
    .prepare(`SELECT 1 FROM secret_friend_assignments WHERE giverId = ?`)
    .get(userId);

    localdb.close();
    return alreadyAssigned;
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