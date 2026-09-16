const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: 'root.8', database: 'arcasdb'
  });

  try {
    const [rows] = await conn.query("SELECT * FROM tcogrupocontable");
    console.log('tcogrupocontable rows:', JSON.stringify(rows, null, 2));
  } finally {
    await conn.end();
  }
}

check().catch(console.error);
