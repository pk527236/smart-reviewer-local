import Database from 'better-sqlite3';

const db = new Database('database.sqlite', { verbose: console.log });

const rows = db.prepare('SELECT * FROM users').all();

console.log('Users:', rows);
