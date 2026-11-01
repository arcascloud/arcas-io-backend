import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CxcCliente } from './entities/cxccliente.entity';
import { CxccClientesRef } from './entities/cxccclientesref.entity';
import { Cxccajero } from './entities/cxccajero.entity';
import { CxccajaMae } from './entities/cxccajamae.entity';
import { CxccajaDet } from './entities/cxccajadet.entity';
import { CxcMovimiento } from './entities/cxcmovimiento.entity';
import { CxcHistoro } from './entities/cxchisto.entity';
import { CxcSalFav } from './entities/cxcsalfav.entity';
import { TcctDiasCobro } from './entities/tcctdiascobro.entity';
import { CxcPrestamo } from './entities/cxcprestamo.entity';
import { CxcPrestamoPP } from './entities/cxcprestamopp.entity';
import { CxcPariente } from './entities/cxcpariente.entity';
import { CxcCarteraCta } from './entities/carteracta.entity';
import { CxcClientesInfo } from './entities/cxccclientesinfo.entity';
import { CxcCategoria } from './entities/cxccategoria.entity';
import { Tcocarteras } from '../contabilidad/entities/tcocarteras.entity';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { TPosFacMae } from '../facturacion/entities/posfacmae.entity';
import { Tempresas } from '../companies/entities/empresa.entity';
import { TempresasDet } from '../companies/entities/empresasdet.entity';
import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';
import { Tcoplantillapdamae } from '../contabilidad/entities/tcoplantillapdamae.entity';
import { Tcoplantillapdadet } from '../contabilidad/entities/tcoplantillapdadet.entity';
import { TtipoFormaPago } from '../parametros/entities/forma-pago.entity';
import { TtipoTarjetaCredito } from '../parametros/entities/tarjeta-credito.entity';
import { ContabilidadModule } from '../contabilidad/contabilidad.module';
import { CxcService } from './cxc.service';
import { CxcController } from './cxc.controller';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([
      CxcCliente,
      CxccClientesRef,
      Cxccajero,
      CxccajaMae,
      CxccajaDet,
      CxcMovimiento,
      CxcHistoro,
      CxcSalFav,
      TcctDiasCobro,
      CxcPrestamo,
      CxcPrestamoPP,
      CxcPariente,
      CxcCarteraCta,
      CxcClientesInfo,
      CxcCategoria,
      Tcocarteras,
      TipoParametro,
      TPosFacMae,
      Tempresas,
      TempresasDet,
      TCoTipoDocumentoFiscal,
      Tcoplantillapdamae,
      Tcoplantillapdadet,
      TtipoFormaPago,
      TtipoTarjetaCredito,
    ]),
    forwardRef(() => ContabilidadModule),
  ],
  controllers: [CxcController],
  providers: [CxcService],
  exports: [CxcService],
})
export class CxcModule {}
