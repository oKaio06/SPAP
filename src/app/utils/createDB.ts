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
            `CREATE TABLE IF NOT EXISTS user_associations (
            associationId INTEGER PRIMARY KEY AUTOINCREMENT,
            user1Id INTEGER NOT NULL,
            user2Id INTEGER NOT NULL,
            FOREIGN KEY (user1Id) REFERENCES users(userId),
            FOREIGN KEY (user2Id) REFERENCES users(userId),
            UNIQUE (user1Id, user2Id), -- Garante que a mesma associação não seja criada duas vezes (na ordem inversa)
            CHECK (user1Id < user2Id) -- Garante que a ordem dos IDs não importa para a unicidade
            );`
        )
    } catch(e){
        console.error(`erro ao criar database dos usuarios :[ ${e}`)
    }
}
