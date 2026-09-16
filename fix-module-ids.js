const mysql = require('mysql2/promise');

async function fixModuleIds() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: 'root.8', database: 'arcasdb'
  });

  try {
    // Eliminar registros duplicados mal migrados (moduloId=2 con campos que no son de inventario)
    // Los registros correctos de moduloId=1 ya existían. Los nuevos de moduloId=2 con campos
    // de FAC/CXC/CXP/CON/BCO/PLA/PRES fueron insertados con moduloId=2 por error.

    // Mapeo de campos → moduloId correcto
    const fieldModuleMap = {
      // FACTURACION (moduloId=3)
      'bodegaId': 3,      // solo si viene de param-fac
      'nroanulacion': 3,
      'impuestoId': 3,
      'cajaId': 3,
      'lineasFactura': 3,
      'diasDevolucion': 3,
      'nrodpdaventas': 3,
      'nropdaanulacion': 3,
      'sn_integrado_cxc': 3,
      'mg-t': 3,
      'mg-b': 3,
      'mg-l': 3,
      'mg-d': 3,
      'sn_impuestoincluido': 3,
      'sn_imprimefactura': 3,
      'nrocotizacion': 3,
      'sn_correlativoUnico': 3,
      'sn_multiplezcajeros': 3,
      // INVENTARIOS (moduloId=2)
      'nrocompra': 2,
      'nrotrasladoo': 2,
      'nroajuste': 2,
      'nrofisico': 2,
      'nrorequisicion': 2,
      'preciovtaId': 2,
      'impuestocompraId': 2,
      'impuestoventaId': 2,
      'sn_requirelote': 2,
      'sn_supermercado': 2,
      'sn_multiplesprecios': 2,
      // CXC (moduloId=4)
      'nrocliente': 4,
      'interes': 4,  // CXC tiene pres_ prefix, pero el campo plain es CXC
      'mora': 4,
      'diasPlazo': 4,
      'limitecredito': 4,
      'ctacontable': null,  // Ambiguous - could be CXC or CXP, leave alone
      // CXP (moduloId=5)
      'nroproveedor': 5,
      // BANCOS (moduloId=6)
      'nromovimiento': 6,
      // CONTABILIDAD (moduloId=7)
      'nropartida': 7,
      // PLANILLA (moduloId=8)
      'nroplanilla': 8,
      'techo': 8,
      'sn_validatecho': 8,
      'diaslaborales': 8,
      // PRES (moduloId=4 con prefijo pres_)
      'pres_interes': 4,
      'pres_mora': 4,
      'pres_diasPlazo': 4,
      'pres_limitecredito': 4,
      'pres_ctacontable': 4,
    };

    // Eliminar los registros mal migrados (moduloId=2 que no corresponden a inventario)
    const fieldsToReassign = Object.keys(fieldModuleMap).filter(f => fieldModuleMap[f] !== 2);
    
    let fixed = 0;
    for (const field of fieldsToReassign) {
      const targetMod = fieldModuleMap[field];
      if (targetMod === null) continue; // skip ambiguous
      
      // Check if the correct one already exists
      const [exists] = await conn.query(
        'SELECT 1 FROM ttipoparametros WHERE empresaId=2 AND moduloId=? AND field=? AND sn_activo="S"',
        [targetMod, field]
      );
      
      if (exists.length > 0) {
        // Already exists in correct module, delete the misplaced one
        const [del] = await conn.query(
          'DELETE FROM ttipoparametros WHERE empresaId=2 AND moduloId=2 AND field=?',
          [field]
        );
        if (del.affectedRows > 0) {
          console.log(`  DELETED misplaced: ${field} (moduloId=2, target=${targetMod})`);
          fixed++;
        }
      } else {
        // Move to correct module
        const [upd] = await conn.query(
          'UPDATE ttipoparametros SET moduloId=? WHERE empresaId=2 AND moduloId=2 AND field=?',
          [targetMod, field]
        );
        if (upd.affectedRows > 0) {
          console.log(`  MOVED: ${field} from 2 → ${targetMod}`);
          fixed++;
        }
      }
    }

    // Handle bodegaId: keep in moduloId=3 (FAC) since it's from param-fac
    // It was already in moduloId=2 from migration, move to 3
    const [bodegaExists] = await conn.query(
      'SELECT 1 FROM ttipoparametros WHERE empresaId=2 AND moduloId=3 AND field="bodegaId" AND sn_activo="S"'
    );
    if (bodegaExists.length > 0) {
      await conn.query('DELETE FROM ttipoparametros WHERE empresaId=2 AND moduloId=2 AND field="bodegaId"');
      console.log('  DELETED misplaced: bodegaId (duplicate in moduloId=2)');
    } else {
      await conn.query('UPDATE ttipoparametros SET moduloId=3 WHERE empresaId=2 AND moduloId=2 AND field="bodegaId"');
      console.log('  MOVED: bodegaId from 2 → 3');
    }

    console.log(`\nFixed: ${fixed} records`);

    // Show final state
    const [byModule] = await conn.query(
      'SELECT moduloId, COUNT(*) as cnt FROM ttipoparametros WHERE empresaId=2 GROUP BY moduloId ORDER BY moduloId'
    );
    console.log('\nPor módulo (corregido):');
    byModule.forEach(r => console.log(`  moduloId=${r.moduloId}: ${r.cnt} params`));

  } finally {
    await conn.end();
  }
}

fixModuleIds().catch(console.error);
