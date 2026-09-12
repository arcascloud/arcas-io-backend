const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'127.0.0.1',port:3306,user:'root',password:'root.8',database:'arcasdb'});
  const [rows] = await c.execute("SHOW TABLES LIKE 'invtrasdet'");
  console.log('Table invtrasdet exists:', rows.length > 0);
  if (rows.length > 0) {
    const [cols] = await c.execute('DESCRIBE invtrasdet');
    console.log('Columns:', JSON.stringify(cols.map(c => c.Field)));
  } else {
    const [tables] = await c.execute("SHOW TABLES LIKE 'invtras%'");
    console.log('Related tables:', JSON.stringify(tables.map(t => Object.values(t)[0])));
  }
  await c.end();
})().catch(e => console.error(e.message));
