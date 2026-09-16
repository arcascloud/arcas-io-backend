import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TPosCorrelativos } from './entities/poscorrelativos.entity';
import { TPosFacMae } from './entities/posfacmae.entity';
import { TPosFacDet } from './entities/posfacdet.entity';
import { TPosFacMaeAnul } from './entities/posfacmaeanul.entity';
import { TPosFacDetAnul } from './entities/posfacdetanul.entity';
import { TPosCotMae } from './entities/poscotmae.entity';
import { TPosCotDet } from './entities/poscotdet.entity';
import { TPosPedMae } from './entities/pospedmae.entity';
import { TPosPedDet } from './entities/pospeddet.entity';
import { TPosCboMae } from './entities/poscbomae.entity';
import { TPosCboDet } from './entities/poscbodet.entity';
import { TPosPrecioVtas } from './entities/tpospreciovtas.entity';
import { TPosDescuentos } from './entities/tposdescuentos.entity';
import { TPosFacCaja } from './entities/posfaccaja.entity';
import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';
import { CxcCliente } from '../cxc/entities/cxccliente.entity';
import { CxccClientesDir } from '../cxc/entities/cxccclientesdir.entity';
import { Tempresas } from '../companies/entities/empresa.entity';
import { TempresasDet } from '../companies/entities/empresasdet.entity';
import { TImpresora } from '../companies/entities/impresoras.entity';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { Tproducto } from '../inventario/entities/producto.entity';
import { TproductoImg } from '../inventario/entities/producto-img.entity';
import { FacturacionService } from './facturacion.service';
import { FacturacionController } from './facturacion.controller';
import { InventarioModule } from '../inventario/inventario.module';
import { CxcModule } from '../cxc/cxc.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([
      TPosCorrelativos,
      TPosFacMae,
      TPosFacDet,
      TPosFacMaeAnul,
      TPosFacDetAnul,
      TPosCotMae,
      TPosCotDet,
      TPosPedMae,
      TPosPedDet,
      TPosCboMae,
      TPosCboDet,
      TPosPrecioVtas,
      TPosDescuentos,
      TPosFacCaja,
      TCoTipoDocumentoFiscal,
      CxcCliente,
      CxccClientesDir,
      Tempresas,
      TempresasDet,
      TImpresora,
      TipoParametro,
      Tproducto,
      TproductoImg,
    ]),
    InventarioModule,
    CxcModule,
  ],
  controllers: [FacturacionController],
  providers: [FacturacionService],
  exports: [FacturacionService],
})
export class FacturacionModule {}
