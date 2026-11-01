import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tmodulos } from './entities/modulo.entity';
import { ModulosService } from './modulos.service';
import { ModulosController } from './modulos.controller';
// RolesService (solo admin puede eliminar un módulo)
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tmodulos]), UsersModule],
  controllers: [ModulosController],
  providers: [ModulosService],
  exports: [ModulosService],
})
export class ModulosModule {}
