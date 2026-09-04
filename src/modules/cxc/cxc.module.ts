import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CxcCliente } from './entities/cxccliente.entity';
import { CxccClientesDir } from './entities/cxccclientesdir.entity';
import { CxcClienteTel } from './entities/cxcclientestel.entity';
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
import { TtipoParamCxc } from '../parametros/entities/param-cxc.entity';
import { CxcService } from './cxc.service';
import { CxcController } from './cxc.controller';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([
      CxcCliente,
      CxccClientesDir,
      CxcClienteTel,
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
      TtipoParamCxc,
    ]),
  ],
  controllers: [CxcController],
  providers: [CxcService],
  exports: [CxcService],
})
export class CxcModule {}
