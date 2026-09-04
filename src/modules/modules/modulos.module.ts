import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tmodulos } from './entities/modulo.entity';
import { ModulosService } from './modulos.service';
import { ModulosController } from './modulos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tmodulos])],
  controllers: [ModulosController],
  providers: [ModulosService],
  exports: [ModulosService],
})
export class ModulosModule {}
