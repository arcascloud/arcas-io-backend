const mysql = require('mysql2/promise');

async function fix() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: 'root.8', database: 'arcasdb'
  });

  try {
    // Agregar columnas de negocio a ttipoparambco
    const [cols] = await conn.query("SHOW COLUMNS FROM ttipoparambco");
    const fields = cols.map(c => c.Field);

    if (!fields.includes('monedaId')) {
      await conn.query("ALTER TABLE ttipoparambco ADD COLUMN monedaId INT NULL AFTER empresaId");
      console.log('✅ monedaId agregada');
    }
    if (!fields.includes('ctacontable')) {
      await conn.query("ALTER TABLE ttipoparambco ADD COLUMN ctacontable VARCHAR(20) NULL AFTER monedaId");
      console.log('✅ ctacontable agregada');
    }
    if (!fields.includes('nromovimiento')) {
      await conn.query("ALTER TABLE ttipoparambco ADD COLUMN nromovimiento DECIMAL(20,0) DEFAULT 0 AFTER ctacontable");
      console.log('✅ nromovimiento agregada');
    }

    // Fix contabilidad: empresaId nullable → NOT NULL
    const nullableTablas = [
      { tabla: 'tcorepdiarios', alias: 't' },
      { tabla: 'tcorepbalances', alias: 'b' },
      { tabla: 'tcoplantillapdadet', alias: 'd' },
      { tabla: 'tcoplantillabalancesdet', alias: 'e' },
    ];

    for (const { tabla } of nullableTablas) {
      try {
        const [rows] = await conn.query(`SHOW COLUMNS FROM ${tabla} LIKE 'empresaId'`);
        if (rows.length > 0 && rows[0].Null === 'YES') {
          // Primero actualizar NULLs al default
          await conn.query(`UPDATE ${tabla} SET empresaId = 2 WHERE empresaId IS NULL`);
          await conn.query(`ALTER TABLE ${tabla} MODIFY COLUMN empresaId INT NOT NULL DEFAULT 2`);
          console.log(`✅ ${tabla}.empresaId: nullable → NOT NULL`);
        } else if (rows.length > 0) {
          console.log(`ℹ️ ${tabla}.empresaId: ya es NOT NULL`);
        }
      } catch (e) {
        console.log(`⚠️ ${tabla}: ${e.message}`);
      }
    }

  } finally {
    await conn.end();
  }
}

fix().catch(console.error);
