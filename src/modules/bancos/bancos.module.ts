import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tbanco } from './entities/banco.entity';
import { TbcoCta } from './entities/bco-cta.entity';
import { TbcoConciliacion } from './entities/bco-conciliacion.entity';
import { TbcoConciliacionDet } from './entities/bco-conciliacion-det.entity';
import { TbcoCcdocs } from './entities/bco-ccdocs.entity';
import { TbcoDireccion } from './entities/bco-direccion.entity';
import { TbcoTelefono } from './entities/bco-telefono.entity';
import { TbcoMovimiento } from './entities/bco-movimiento.entity';
import { TCxpCompraMae } from '../cxp/entities/compra-mae.entity';
import { TCxpMovimiento } from '../cxp/entities/movimiento.entity';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { BancosService } from './bancos.service';
import { BancosController } from './bancos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tbanco,
      TbcoCta,
      TbcoConciliacion,
      TbcoConciliacionDet,
      TbcoCcdocs,
      TbcoDireccion,
      TbcoTelefono,
      TbcoMovimiento,
      TCxpCompraMae,
      TCxpMovimiento,
      TipoParametro,
    ]),
  ],
  controllers: [BancosController],
  providers: [BancosService],
  exports: [BancosService],
})
export class BancosModule {}
