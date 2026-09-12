import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TCxpProveedor } from './entities/proveedor.entity';
import { TCxpProveedorDir } from './entities/proveedordir.entity';
import { TCxpProveedorTel } from './entities/proveedortel.entity';
import { TCxpCompraMae } from './entities/compra-mae.entity';
import { TCxpCompraDet } from './entities/compra-det.entity';
import { TCxpMovimiento } from './entities/movimiento.entity';
import { TCxpHistorico } from './entities/historico.entity';
import { TCxpSaldoAv } from './entities/saldoav.entity';
import { Tproducto } from '../inventario/entities/producto.entity';
import { TPosPrecioVtas } from '../facturacion/entities/tpospreciovtas.entity';
import { Tmodulos } from '../modules/entities/modulo.entity';
import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';
import { CxpService } from './cxp.service';
import { CxpController } from './cxp.controller';
import { InventarioModule } from '../inventario/inventario.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([
      TCxpProveedor,
      TCxpProveedorDir,
      TCxpProveedorTel,
      TCxpCompraMae,
      TCxpCompraDet,
      TCxpMovimiento,
      TCxpHistorico,
      TCxpSaldoAv,
      Tproducto,
      TPosPrecioVtas,
      Tmodulos,
      TCoTipoDocumentoFiscal,
    ]),
    InventarioModule,
  ],
  controllers: [CxpController],
  providers: [CxpService],
  exports: [CxpService],
})
export class CxpModule {}
