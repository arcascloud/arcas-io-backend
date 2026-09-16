const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({host:'127.0.0.1',port:3306,user:'root',password:'root.8',database:'arcasdb'});
  try {
    const [cols] = await conn.query('DESCRIBE ttipoparamfac');
    const colNames = cols.map(c => c.Field);
    
    if (!colNames.includes('sn_multiplezcajeros')) {
      await conn.query("ALTER TABLE ttipoparamfac ADD COLUMN sn_multiplezcajeros ENUM('S','N') DEFAULT 'N' AFTER `mg-d`");
      console.log('Columna sn_multiplezcajeros agregada OK');
    } else {
      console.log('sn_multiplezcajeros ya existe');
    }
    
    console.log('Columnas finales:', colNames.join(', '));
  } catch(e) {
    console.error('Error:', e.message);
  }
  await conn.end();
})();
