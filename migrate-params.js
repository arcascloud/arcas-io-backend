/**
 * Migra datos de las tablas viejas (ttipoparamfac, param-inv, etc.)
 * hacia la tabla unificada ttipoparametros.
 *
 * Tabla vieja → moduloId mapping:
 *   ttipoparamfac  → 3 (FACTURACION)
 *   ttipoparaminv  → 2 (INVENTARIOS)
 *   ttipoparamcxc  → 4 (CXC)
 *   ttipoparamcxp  → 5 (CXP)
 *   ttipoparamcon  → 7 (CONTABILIDAD)
 *   ttipoparambco  → 6 (BANCOS)
 *   ttipoparampap  → 9 (MENU) o específico
 *   ttipoparampla  → 8 (PLANILLA)
 *   ttipoparampres → 4 (CXC) o específico
 */
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: 'root.8', database: 'arcasdb'
  });

  try {
    let inserted = 0;
    let skipped = 0;

    // 1. ttipoparamfac → moduloId=3 (FACTURACION)
    const [fac] = await conn.query('SELECT * FROM ttipoparamfac WHERE empresaId = 2');
    const facFields = ['bodegaId','nroanulacion','impuestoId','cajaId','lineasFactura','diasDevolucion',
      'nrodpdaventas','nropdaanulacion','sn_integrado_cxc','mg-t','mg-b','mg-l','mg-d',
      'sn_impuestoincluido','sn_imprimefactura','nrocotizacion','sn_correlativoUnico','sn_multiplezcajeros'];
    if (fac.length > 0) {
      const row = fac[0];
      for (const field of facFields) {
        if (row[field] === undefined || row[field] === null) continue;
        const val = String(row[field]);
        const tipo = typeof row[field] === 'number' || !isNaN(row[field]) ? 'NUMBER' : 'STRING';
        const exists = await conn.query(
          'SELECT 1 FROM ttipoparametros WHERE empresaId=2 AND moduloId=3 AND field=?', [field]
        );
        if (exists[0].length > 0) { skipped++; continue; }
        await conn.query(
          'INSERT INTO ttipoparametros (field, tipo, valor, sn_activo, moduloId, Idsucursal, empresaId, usuarioCreated, fechaCreated) VALUES (?,?,?,?,2,1,2,\'admin\',NOW())',
          [field, tipo === 'NUMBER' ? 'NUMBER' : 'STRING', val, 'S', 3]
        );
        inserted++;
        console.log(`  [FAC] ${field} = ${val}`);
      }
    }

    // 2. ttipoparaminv → moduloId=2 (INVENTARIOS)
    const [inv] = await conn.query('SELECT * FROM ttipoparaminv WHERE empresaId = 2');
    const invFields = ['bodegaId','nrocompra','nrotrasladoo','nroajuste','nrofisico','nrorequisicion',
      'preciovtaId','impuestocompraId','impuestoventaId','nropartida',
      'sn_requirelote','sn_supermercado','sn_multiplesprecios'];
    if (inv.length > 0) {
      const row = inv[0];
      for (const field of invFields) {
        if (row[field] === undefined || row[field] === null) continue;
        const val = String(row[field]);
        const tipo = typeof row[field] === 'number' || !isNaN(row[field]) ? 'NUMBER' : 'STRING';
        const exists = await conn.query(
          'SELECT 1 FROM ttipoparametros WHERE empresaId=2 AND moduloId=2 AND field=?', [field]
        );
        if (exists[0].length > 0) { skipped++; continue; }
        await conn.query(
          'INSERT INTO ttipoparametros (field, tipo, valor, sn_activo, moduloId, Idsucursal, empresaId, usuarioCreated, fechaCreated) VALUES (?,?,?,?,2,1,2,\'admin\',NOW())',
          [field, tipo === 'NUMBER' ? 'NUMBER' : 'STRING', val, 'S', 2]
        );
        inserted++;
        console.log(`  [INV] ${field} = ${val}`);
      }
    }

    // 3. ttipoparamcxc → moduloId=4 (CXC) - ya tienen datos, verificar faltantes
    const [cxc] = await conn.query('SELECT * FROM ttipoparamcxc WHERE empresaId = 2');
    const cxcFields = ['nrocliente','interes','mora','diasPlazo','limitecredito','ctacontable'];
    if (cxc.length > 0) {
      const row = cxc[0];
      for (const field of cxcFields) {
        if (row[field] === undefined || row[field] === null) continue;
        const val = String(row[field]);
        const tipo = typeof row[field] === 'number' || !isNaN(row[field]) ? 'NUMBER' : 'STRING';
        const exists = await conn.query(
          'SELECT 1 FROM ttipoparametros WHERE empresaId=2 AND moduloId=4 AND field=?', [field]
        );
        if (exists[0].length > 0) { skipped++; continue; }
        await conn.query(
          'INSERT INTO ttipoparametros (field, tipo, valor, sn_activo, moduloId, Idsucursal, empresaId, usuarioCreated, fechaCreated) VALUES (?,?,?,?,2,1,2,\'admin\',NOW())',
          [field, tipo === 'NUMBER' ? 'NUMBER' : 'STRING', val, 'S', 4]
        );
        inserted++;
        console.log(`  [CXC] ${field} = ${val}`);
      }
    }

    // 4. ttipoparamcxp → moduloId=5 (CXP)
    const [cxp] = await conn.query('SELECT * FROM ttipoparamcxp WHERE empresaId = 2');
    const cxpFields = ['nroproveedor','interes','mora','diasPlazo','limitecredito','ctacontable'];
    if (cxp.length > 0) {
      const row = cxp[0];
      for (const field of cxpFields) {
        if (row[field] === undefined || row[field] === null) continue;
        const val = String(row[field]);
        const tipo = typeof row[field] === 'number' || !isNaN(row[field]) ? 'NUMBER' : 'STRING';
        const exists = await conn.query(
          'SELECT 1 FROM ttipoparametros WHERE empresaId=2 AND moduloId=5 AND field=?', [field]
        );
        if (exists[0].length > 0) { skipped++; continue; }
        await conn.query(
          'INSERT INTO ttipoparametros (field, tipo, valor, sn_activo, moduloId, Idsucursal, empresaId, usuarioCreated, fechaCreated) VALUES (?,?,?,?,2,1,2,\'admin\',NOW())',
          [field, tipo === 'NUMBER' ? 'NUMBER' : 'STRING', val, 'S', 5]
        );
        inserted++;
        console.log(`  [CXP] ${field} = ${val}`);
      }
    }

    // 5. ttipoparamcon → moduloId=7 (CONTABILIDAD)
    const [con] = await conn.query('SELECT * FROM ttipoparamcon WHERE empresaId = 2');
    const conFields = ['nropartida','periodofiscal','aniofiscal','monedafiscalId','mascaracta',
      'nombrecontador','nombregerente','nombreauditor'];
    if (con.length > 0) {
      const row = con[0];
      for (const field of conFields) {
        if (row[field] === undefined || row[field] === null) continue;
        const val = String(row[field]);
        const tipo = typeof row[field] === 'number' || !isNaN(row[field]) ? 'NUMBER' : 'STRING';
        const exists = await conn.query(
          'SELECT 1 FROM ttipoparametros WHERE empresaId=2 AND moduloId=7 AND field=?', [field]
        );
        if (exists[0].length > 0) { skipped++; continue; }
        await conn.query(
          'INSERT INTO ttipoparametros (field, tipo, valor, sn_activo, moduloId, Idsucursal, empresaId, usuarioCreated, fechaCreated) VALUES (?,?,?,?,2,1,2,\'admin\',NOW())',
          [field, tipo === 'NUMBER' ? 'NUMBER' : 'STRING', val, 'S', 7]
        );
        inserted++;
        console.log(`  [CON] ${field} = ${val}`);
      }
    }

    // 6. ttipoparambco → moduloId=6 (BANCOS)
    const [bco] = await conn.query('SELECT * FROM ttipoparambco WHERE empresaId = 2');
    const bcoFields = ['monedaId','ctacontable','nromovimiento'];
    if (bco.length > 0) {
      const row = bco[0];
      for (const field of bcoFields) {
        if (row[field] === undefined || row[field] === null) continue;
        const val = String(row[field]);
        const tipo = typeof row[field] === 'number' || !isNaN(row[field]) ? 'NUMBER' : 'STRING';
        const exists = await conn.query(
          'SELECT 1 FROM ttipoparametros WHERE empresaId=2 AND moduloId=6 AND field=?', [field]
        );
        if (exists[0].length > 0) { skipped++; continue; }
        await conn.query(
          'INSERT INTO ttipoparametros (field, tipo, valor, sn_activo, moduloId, Idsucursal, empresaId, usuarioCreated, fechaCreated) VALUES (?,?,?,?,2,1,2,\'admin\',NOW())',
          [field, tipo === 'NUMBER' ? 'NUMBER' : 'STRING', val, 'S', 6]
        );
        inserted++;
        console.log(`  [BCO] ${field} = ${val}`);
      }
    }

    // 7. ttipoparampla → moduloId=8 (PLANILLA)
    const [pla] = await conn.query('SELECT * FROM ttipoparampla WHERE empresaId = 2');
    const plaFields = ['nropartida','nroplanilla','techo','sn_validatecho','diaslaborales'];
    if (pla.length > 0) {
      const row = pla[0];
      for (const field of plaFields) {
        if (row[field] === undefined || row[field] === null) continue;
        const val = String(row[field]);
        const tipo = typeof row[field] === 'number' || !isNaN(row[field]) ? 'NUMBER' : 'STRING';
        const exists = await conn.query(
          'SELECT 1 FROM ttipoparametros WHERE empresaId=2 AND moduloId=8 AND field=?', [field]
        );
        if (exists[0].length > 0) { skipped++; continue; }
        await conn.query(
          'INSERT INTO ttipoparametros (field, tipo, valor, sn_activo, moduloId, Idsucursal, empresaId, usuarioCreated, fechaCreated) VALUES (?,?,?,?,2,1,2,\'admin\',NOW())',
          [field, tipo === 'NUMBER' ? 'NUMBER' : 'STRING', val, 'S', 8]
        );
        inserted++;
        console.log(`  [PLA] ${field} = ${val}`);
      }
    }

    // 8. ttipoparampres → moduloId=4 (CXC) o específico, usar 4 por ser préstamos de clientes
    const [pres] = await conn.query('SELECT * FROM ttipoparampres WHERE empresaId = 2');
    const presFields = ['interes','mora','diasPlazo','limitecredito','ctacontable'];
    if (pres.length > 0) {
      const row = pres[0];
      for (const field of presFields) {
        if (row[field] === undefined || row[field] === null) continue;
        const val = String(row[field]);
        const tipo = typeof row[field] === 'number' || !isNaN(row[field]) ? 'NUMBER' : 'STRING';
        // Préstamos → prefijo 'pres_' para distinguir de CxC
        const dbField = 'pres_' + field;
        const exists = await conn.query(
          'SELECT 1 FROM ttipoparametros WHERE empresaId=2 AND moduloId=4 AND field=?', [dbField]
        );
        if (exists[0].length > 0) { skipped++; continue; }
        await conn.query(
          'INSERT INTO ttipoparametros (field, tipo, valor, sn_activo, moduloId, Idsucursal, empresaId, usuarioCreated, fechaCreated) VALUES (?,?,?,?,2,1,2,\'admin\',NOW())',
          [dbField, tipo === 'NUMBER' ? 'NUMBER' : 'STRING', val, 'S', 4]
        );
        inserted++;
        console.log(`  [PRES] ${dbField} = ${val}`);
      }
    }

    // 9. ttipoparampap → moduloId=9 (MENU/PAP)
    const [pap] = await conn.query('SELECT * FROM ttipoparampap WHERE empresaId = 2');
    const papFields = ['moduloId','proforma','reporte'];
    if (pap.length > 0) {
      const row = pap[0];
      for (const field of papFields) {
        if (row[field] === undefined || row[field] === null) continue;
        const val = String(row[field]);
        const tipo = typeof row[field] === 'number' || !isNaN(row[field]) ? 'NUMBER' : 'STRING';
        const exists = await conn.query(
          'SELECT 1 FROM ttipoparametros WHERE empresaId=2 AND moduloId=9 AND field=?', [field]
        );
        if (exists[0].length > 0) { skipped++; continue; }
        await conn.query(
          'INSERT INTO ttipoparametros (field, tipo, valor, sn_activo, moduloId, Idsucursal, empresaId, usuarioCreated, fechaCreated) VALUES (?,?,?,?,2,1,2,\'admin\',NOW())',
          [field, tipo === 'NUMBER' ? 'NUMBER' : 'STRING', val, 'S', 9]
        );
        inserted++;
        console.log(`  [PAP] ${field} = ${val}`);
      }
    }

    // Also migrate modulo 1 items that are not in ttipoparametros yet
    // ttipoparamfac has sn_correlativoUnico, sn_multiplezcajeros
    if (fac.length > 0) {
      const row = fac[0];
      for (const field of ['sn_correlativoUnico','sn_multiplezcajeros']) {
        if (row[field] === undefined || row[field] === null) continue;
        const val = String(row[field]);
        const exists = await conn.query(
          'SELECT 1 FROM ttipoparametros WHERE empresaId=2 AND moduloId=3 AND field=?', [field]
        );
        if (exists[0].length > 0) { skipped++; continue; }
        await conn.query(
          'INSERT INTO ttipoparametros (field, tipo, valor, sn_activo, moduloId, Idsucursal, empresaId, usuarioCreated, fechaCreated) VALUES (?,?,?,?,2,1,2,\'admin\',NOW())',
          [field, 'STRING', val, 'S', 3]
        );
        inserted++;
        console.log(`  [FAC] ${field} = ${val}`);
      }
    }

    console.log(`\n=== Migración completada ===`);
    console.log(`Insertados: ${inserted}`);
    console.log(`Saltados (ya existían): ${skipped}`);

    // Show final state
    const [count] = await conn.query('SELECT COUNT(*) as total FROM ttipoparametros WHERE empresaId=2');
    console.log(`Total registros ttipoparametros (empresa=2): ${count[0].total}`);

    const [byModule] = await conn.query(
      'SELECT moduloId, COUNT(*) as cnt FROM ttipoparametros WHERE empresaId=2 GROUP BY moduloId ORDER BY moduloId'
    );
    console.log('\nPor módulo:');
    byModule.forEach(r => console.log(`  moduloId=${r.moduloId}: ${r.cnt} params`));

  } finally {
    await conn.end();
  }
}

migrate().catch(console.error);
