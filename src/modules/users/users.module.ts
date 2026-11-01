import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tusuarios } from './entities/usuario.entity';
import { TusuariosModule } from './entities/usuarios-module.entity';
import { TusuarioMnuItem } from './entities/usuarios-mnuitem.entity';
import { TusuariosScripts } from './entities/usuarios-scripts.entity';
import { UsuarioModAuth } from './entities/usuario-modauth.entity';
import { TtipoRol } from './entities/ttipo-rol.entity';
import { TusuariosRol } from './entities/tusuarios-rol.entity';
import { TusuarioInfo } from './entities/usuario-info.entity';
import { Tmodulos } from '../modules/entities/modulo.entity';
import { UsersService } from './users.service';
import { RolesService } from './roles.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    Tusuarios,
    TusuariosModule,
    TusuarioMnuItem,
    TusuariosScripts,
    UsuarioModAuth,
    TtipoRol,
    TusuariosRol,
    TusuarioInfo,
    Tmodulos,
  ])],
  controllers: [UsersController],
  providers: [UsersService, RolesService],
  exports: [UsersService, RolesService],
})
export class UsersModule {}
