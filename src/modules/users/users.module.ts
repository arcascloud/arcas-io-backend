import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tusuarios } from './entities/usuario.entity';
import { TusuariosModule } from './entities/usuarios-module.entity';
import { TusuarioMnuItem } from './entities/usuarios-mnuitem.entity';
import { TusuariosScripts } from './entities/usuarios-scripts.entity';
import { UsuarioModAuth } from './entities/usuario-modauth.entity';
import { Tmodulos } from '../modules/entities/modulo.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    Tusuarios,
    TusuariosModule,
    TusuarioMnuItem,
    TusuariosScripts,
    UsuarioModAuth,
    Tmodulos,
  ])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
