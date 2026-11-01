import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TCxpProveedor } from './entities/proveedor.entity';
import { TCxpCompraMae } from './entities/compra-mae.entity';
import { TCxpCompraDet } from './entities/compra-det.entity';
import { TCxpMovimiento } from './entities/movimiento.entity';
import { TCxpHistorico } from './entities/historico.entity';
import { TCxpSaldoAv } from './entities/saldoav.entity';
import { TCxpCarteraCta } from './entities/carteracta.entity';
import { TCxpProveedorInfo } from './entities/proveedorinfo.entity';
import { Tproducto } from '../inventario/entities/producto.entity';
import { TPosPrecioVtas } from '../facturacion/entities/tpospreciovtas.entity';
import { Tmodulos } from '../modules/entities/modulo.entity';
import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';
import { Tcocarteras } from '../contabilidad/entities/tcocarteras.entity';
import { Tcoplantillapdamae } from '../contabilidad/entities/tcoplantillapdamae.entity';
import { Tcoplantillapdadet } from '../contabilidad/entities/tcoplantillapdadet.entity';
import { Coctamov } from '../contabilidad/entities/coctamov.entity';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { CxpService } from './cxp.service';
import { CxpController } from './cxp.controller';
import { InventarioModule } from '../inventario/inventario.module';
import { ContabilidadModule } from '../contabilidad/contabilidad.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([
      TCxpProveedor,
      TCxpCompraMae,
      TCxpCompraDet,
      TCxpMovimiento,
      TCxpHistorico,
      TCxpSaldoAv,
      TCxpCarteraCta,
      TCxpProveedorInfo,
      Tproducto,
      TPosPrecioVtas,
      Tmodulos,
      TCoTipoDocumentoFiscal,
      Tcocarteras,
      TipoParametro,
      Tcoplantillapdamae,
      Tcoplantillapdadet,
      Coctamov,
    ]),
    InventarioModule,
    ContabilidadModule,
  ],
  controllers: [CxpController],
  providers: [CxpService],
  exports: [CxpService],
})
export class CxpModule {}
