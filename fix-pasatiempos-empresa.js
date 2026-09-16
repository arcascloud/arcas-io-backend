const mysql = require('mysql2/promise');

async function fix() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: 'root.8', database: 'arcasdb'
  });

  try {
    // 1. Agregar empresaId a ttipopasatiempos
    const [cols] = await conn.query("SHOW COLUMNS FROM ttipopasatiempos LIKE 'empresaId'");
    if (cols.length === 0) {
      await conn.query("ALTER TABLE ttipopasatiempos ADD COLUMN empresaId INT NOT NULL DEFAULT 2 AFTER sn_activo");
      console.log('✅ ttipopasatiempos: columna empresaId agregada');
    } else {
      console.log('ℹ️ ttipopasatiempos: empresaId ya existe');
    }

    // 2. Agregar empresaId a tcogrupocontable
    const [cols2] = await conn.query("SHOW COLUMNS FROM tcogrupocontable LIKE 'empresaId'");
    if (cols2.length === 0) {
      await conn.query("ALTER TABLE tcogrupocontable ADD COLUMN empresaId INT NOT NULL DEFAULT 2 AFTER sn_activo");
      console.log('✅ tcogrupocontable: columna empresaId agregada');
    } else {
      console.log('ℹ️ tcogrupocontable: empresaId ya existe');
    }

    // 3. Verificar ttipoparambco
    const [cols3] = await conn.query("SHOW COLUMNS FROM ttipoparambco");
    console.log('\n📋 ttipoparambco columnas:', cols3.map(c => c.Field).join(', '));

    // 4. Verificar contabilidad nullable empresaId
    const tablas = ['tcorepliquidez', 'tcorepdiarios', 'tcorepbalances', 'tcoplantillapdadet', 'tcoplantillabalancesdet'];
    for (const t of tablas) {
      try {
        const [rows] = await conn.query(`SHOW COLUMNS FROM ${t} LIKE 'empresaId'`);
        if (rows.length > 0) {
          const nullable = rows[0].Null === 'YES';
          console.log(`📋 ${t}.empresaId: nullable=${nullable}`);
        }
      } catch (e) {
        console.log(`⚠️ ${t}: tabla no encontrada`);
      }
    }

  } finally {
    await conn.end();
  }
}

fix().catch(console.error);
