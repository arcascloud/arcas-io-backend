const mysql = require('mysql2/promise');

async function audit() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: 'root.8', database: 'arcasdb'
  });

  try {
    // 1. Módulos existentes
    const [modulos] = await conn.query("SELECT moduloId, descripcion FROM tmodulos ORDER BY moduloId");
    console.log('=== MÓDULOS ===');
    modulos.forEach(m => console.log(`  ${m.moduloId}: ${m.descripcion}`));

    // 2. Datos de cada tabla de parámetros
    const paramTables = [
      { table: 'ttipoparamfac', name: 'Facturación' },
      { table: 'ttipoparaminv', name: 'Inventario' },
      { table: 'ttipoparamcxc', name: 'CxC' },
      { table: 'ttipoparamcxp', name: 'CxP' },
      { table: 'ttipoparamcon', name: 'Contabilidad' },
      { table: 'ttipoparambco', name: 'Bancos' },
      { table: 'ttipoparampap', name: 'Papelería' },
      { table: 'ttipoparampla', name: 'Planilla' },
      { table: 'ttipoparampres', name: 'Préstamos' },
    ];

    for (const { table, name } of paramTables) {
      try {
        const [cols] = await conn.query(`SHOW COLUMNS FROM ${table}`);
        const [rows] = await conn.query(`SELECT * FROM ${table} LIMIT 1`);
        const colNames = cols.map(c => c.Field).filter(f => !['empresaId','usuarioCreated','fechaCreated','usuarioUpdated','usuarioUpdate','fechaUpdated','fechaUpdate'].includes(f));
        console.log(`\n=== ${name} (${table}) ===`);
        console.log(`  Campos: ${colNames.join(', ')}`);
        if (rows.length > 0) {
          colNames.forEach(f => {
            const val = rows[0][f];
            if (val !== null && val !== undefined && val !== '0' && val !== 0 && val !== '') {
              console.log(`  ${f} = ${val}`);
            }
          });
        }
      } catch (e) {
        console.log(`\n=== ${name} (${table}): NO EXISTE ===`);
      }
    }

    // 3. Verificar si ttipoparametros ya existe
    const [tables] = await conn.query("SHOW TABLES LIKE 'ttipoparametros'");
    console.log(`\n=== ttipoparametros existe: ${tables.length > 0 ? 'SÍ' : 'NO'} ===`);
    if (tables.length > 0) {
      const [rows] = await conn.query("SELECT COUNT(*) as total FROM ttipoparametros");
      console.log(`  Registros: ${rows[0].total}`);
    }

  } finally {
    await conn.end();
  }
}

audit().catch(console.error);
