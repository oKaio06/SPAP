import Database from 'better-sqlite3';

export default async function createDB(dbPath: string) {

    let db;

    try{
        db = new Database(dbPath);
        db.exec(
            `CREATE TABLE IF NOT EXISTS users(
            userId INTEGER PRIMARY KEY AUTOINCREMENT,
            userName TEXT NOT NULL,
            userPasswordHash TEXT NOT NULL,
            userNameHash TEXT UNIQUE NOT NULL
            );`
        );
        db.exec(
            `CREATE TABLE IF NOT EXISTS secret_friend_assignments (
          assignmentId INTEGER PRIMARY KEY AUTOINCREMENT,
          giverId INTEGER NOT NULL,
          receiverId INTEGER NOT NULL,
          FOREIGN KEY(giverId) REFERENCES users(userId),
          FOREIGN KEY(receiverId) REFERENCES users(userId),
          UNIQUE(giverId),    -- cada usuário só pode ser designado uma vez como doador
          UNIQUE(receiverId)  -- cada usuário só pode receber uma designação
            );`
        )
    } catch(e){
        console.error(`erro ao criar database dos usuarios :[ ${e}`)
    }
}
