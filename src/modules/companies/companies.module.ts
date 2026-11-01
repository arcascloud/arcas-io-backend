import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tempresas } from './entities/empresa.entity';
import { TempresasDet } from './entities/empresasdet.entity';
import { TempresasLogo } from './entities/empresaslogo.entity';
import { TImpresora } from './entities/impresoras.entity';
import { TCaiAutorizado } from '../facturacion/entities/cai-autorizado.entity';
import { TCai } from './entities/tcai.entity';
import { Tsucursal } from '../sucursales/entities/sucursal.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tempresas, TempresasDet, TempresasLogo, TImpresora, TCaiAutorizado, TCai, Tsucursal])],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
