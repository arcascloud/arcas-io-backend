import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoParametro } from '../modules/parametros/entities/tipo-parametro.entity';
import { Tusuarios } from '../modules/users/entities/usuario.entity';
import { CorrelativosService } from './correlativos.service';

/**
 * Módulo global del control de correlativos (ttipoparametros).
 * Disponible en todo el backend sin importarlo en cada módulo feature.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([TipoParametro, Tusuarios])],
  providers: [CorrelativosService],
  exports: [CorrelativosService],
})
export class CorrelativosModule {}
