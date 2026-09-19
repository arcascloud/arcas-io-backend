const mysql = require('mysql2/promise');
async function main() {
  const conn = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'root', password: 'root.8', database: 'arcasdb' });
  const [templates] = await conn.query(`
    SELECT mae.tcoplantillapdamaeId, mae.descripcion AS plantilla, mae.moduloId,
           det.nrofila, det.ctacontable, det.descripcion, det.naturaleza, det.ctamayorId
    FROM tcoplantillapdadet det
    INNER JOIN tcoplantillapdamae mae ON mae.tcoplantillapdamaeId=det.tcoplantillapdamaeId
    ORDER BY mae.descripcion, det.nrofila
  `);
  console.log('\n=== PLANTILLAS PDA ===');
  console.table(templates);

  const [params] = await conn.query(`SELECT * FROM ttipoparametros WHERE empresaId=1 ORDER BY moduloId, field`);
  console.log('\n=== PARAMETROS ===');
  console.table(params);

  const [posfacmae] = await conn.query(`SHOW COLUMNS FROM posfacmae`);
  console.log('\n=== POSFACMAE COLUMNS ===');
  console.table(posfacmae);

  const [plantillaMae] = await conn.query(`SELECT * FROM tcoplantillapdamae`);
  console.log('\n=== PLANTILLAS PDA MAE ===');
  console.table(plantillaMae);

  await conn.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
