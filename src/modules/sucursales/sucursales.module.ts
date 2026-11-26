import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tsucursal } from './entities/sucursal.entity';
import { TinvBodega } from '../inventario/entities/bodega.entity';
import { SucursalesService } from './sucursales.service';
import { SucursalesController } from './sucursales.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tsucursal, TinvBodega])],
  controllers: [SucursalesController],
  providers: [SucursalesService],
  exports: [SucursalesService],
})
export class SucursalesModule {}
