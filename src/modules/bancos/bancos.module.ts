import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tbanco } from './entities/banco.entity';
import { TbcoCta } from './entities/bco-cta.entity';
import { TbcoConciliacion } from './entities/bco-conciliacion.entity';
import { TbcoConciliacionDet } from './entities/bco-conciliacion-det.entity';
import { TbcoDireccion } from './entities/bco-direccion.entity';
import { TbcoTelefono } from './entities/bco-telefono.entity';
import { BancosService } from './bancos.service';
import { BancosController } from './bancos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tbanco,
      TbcoCta,
      TbcoConciliacion,
      TbcoConciliacionDet,
      TbcoDireccion,
      TbcoTelefono,
    ]),
  ],
  controllers: [BancosController],
  providers: [BancosService],
  exports: [BancosService],
})
export class BancosModule {}
