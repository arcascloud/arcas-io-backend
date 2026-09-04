const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'root.8', database: 'arcasdb' });
  const [r] = await c.query('SHOW CREATE TABLE invkardex');
  console.log(r[0]['Create Table']);
  await c.end();
})();
