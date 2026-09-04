import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';
import { CreateUsuariosModuleDto, UpdateUsuariosModuleDto } from './dto/usuarios-module.dto';
import { CreateUsuarioMnuItemDto, UpdateUsuarioMnuItemDto } from './dto/usuarios-mnuitem.dto';
import { CreateUsuariosScriptsDto, UpdateUsuariosScriptsDto } from './dto/usuarios-scripts.dto';
import { CreateUsuarioModAuthDto, UpdateUsuarioModAuthDto } from './dto/usuario-modauth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // ===== Usuarios =====

  @Get()
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida exitosamente' })
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAll(empresaId);
  }

  @Get(':usuario')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(
    @Param('usuario') usuario: string,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOne(usuario, empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  create(@Body() dto: CreateUsuarioDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.usuario);
  }

  @Put(':usuario')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  update(
    @Param('usuario') usuario: string,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuarioDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(usuario, empresaId, dto, user.usuario);
  }

  // ===== UsuariosModule =====

  @Get('modules')
  @ApiOperation({ summary: 'Listar módulos de usuario' })
  @ApiResponse({ status: 200, description: 'Lista de módulos de usuario obtenida exitosamente' })
  findAllModules(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllModules(empresaId);
  }

  @Get('modules/:id')
  @ApiOperation({ summary: 'Obtener módulo de usuario por ID' })
  @ApiResponse({ status: 200, description: 'Módulo de usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Módulo de usuario no encontrado' })
  findModule(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findModule(id, empresaId);
  }

  @Post('modules')
  @ApiOperation({ summary: 'Crear módulo de usuario' })
  @ApiResponse({ status: 201, description: 'Módulo de usuario creado exitosamente' })
  createModule(@Body() dto: CreateUsuariosModuleDto, @CurrentUser() user: any) {
    return this.service.createModule(dto, user.usuario);
  }

  @Put('modules/:id')
  @ApiOperation({ summary: 'Actualizar módulo de usuario' })
  @ApiResponse({ status: 200, description: 'Módulo de usuario actualizado exitosamente' })
  updateModule(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuariosModuleDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateModule(id, empresaId, dto, user.usuario);
  }

  @Delete('modules/:id')
  @ApiOperation({ summary: 'Eliminar módulo de usuario' })
  @ApiResponse({ status: 200, description: 'Módulo de usuario eliminado exitosamente' })
  removeModule(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeModule(id, empresaId);
  }

  // ===== UsuarioMnuItem =====

  @Get('menu-items')
  @ApiOperation({ summary: 'Listar items de menú de usuario' })
  @ApiResponse({ status: 200, description: 'Lista de items de menú obtenida exitosamente' })
  findAllMnuItems(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMnuItems(empresaId);
  }

  @Get('menu-items/:id')
  @ApiOperation({ summary: 'Obtener item de menú por ID' })
  @ApiResponse({ status: 200, description: 'Item de menú encontrado' })
  @ApiResponse({ status: 404, description: 'Item de menú no encontrado' })
  findMnuItem(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMnuItem(id, empresaId);
  }

  @Post('menu-items')
  @ApiOperation({ summary: 'Crear item de menú' })
  @ApiResponse({ status: 201, description: 'Item de menú creado exitosamente' })
  createMnuItem(@Body() dto: CreateUsuarioMnuItemDto, @CurrentUser() user: any) {
    return this.service.createMnuItem(dto, user.usuario);
  }

  @Put('menu-items/:id')
  @ApiOperation({ summary: 'Actualizar item de menú' })
  @ApiResponse({ status: 200, description: 'Item de menú actualizado exitosamente' })
  updateMnuItem(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuarioMnuItemDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMnuItem(id, empresaId, dto, user.usuario);
  }

  @Delete('menu-items/:id')
  @ApiOperation({ summary: 'Eliminar item de menú' })
  @ApiResponse({ status: 200, description: 'Item de menú eliminado exitosamente' })
  removeMnuItem(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeMnuItem(id, empresaId);
  }

  // ===== UsuariosScripts =====

  @Get('scripts')
  @ApiOperation({ summary: 'Listar scripts de usuario' })
  @ApiResponse({ status: 200, description: 'Lista de scripts obtenida exitosamente' })
  findAllScripts(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllScripts(empresaId);
  }

  @Get('scripts/:id')
  @ApiOperation({ summary: 'Obtener script por ID' })
  @ApiResponse({ status: 200, description: 'Script encontrado' })
  @ApiResponse({ status: 404, description: 'Script no encontrado' })
  findScript(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findScript(id, empresaId);
  }

  @Post('scripts')
  @ApiOperation({ summary: 'Crear script' })
  @ApiResponse({ status: 201, description: 'Script creado exitosamente' })
  createScript(@Body() dto: CreateUsuariosScriptsDto, @CurrentUser() user: any) {
    return this.service.createScript(dto, user.usuario);
  }

  @Put('scripts/:id')
  @ApiOperation({ summary: 'Actualizar script' })
  @ApiResponse({ status: 200, description: 'Script actualizado exitosamente' })
  updateScript(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuariosScriptsDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateScript(id, empresaId, dto, user.usuario);
  }

  @Delete('scripts/:id')
  @ApiOperation({ summary: 'Eliminar script' })
  @ApiResponse({ status: 200, description: 'Script eliminado exitosamente' })
  removeScript(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeScript(id, empresaId);
  }

  // ===== UsuarioModAuth =====

  @Get('mod-auth')
  @ApiOperation({ summary: 'Listar autenticaciones de módulo' })
  @ApiResponse({ status: 200, description: 'Lista de autenticaciones de módulo obtenida exitosamente' })
  findAllModAuth(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllModAuth(empresaId);
  }

  @Get('mod-auth/:id')
  @ApiOperation({ summary: 'Obtener autenticación de módulo por ID' })
  @ApiResponse({ status: 200, description: 'Autenticación de módulo encontrada' })
  @ApiResponse({ status: 404, description: 'Autenticación de módulo no encontrada' })
  findModAuth(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findModAuth(id, empresaId);
  }

  @Post('mod-auth')
  @ApiOperation({ summary: 'Crear autenticación de módulo' })
  @ApiResponse({ status: 201, description: 'Autenticación de módulo creada exitosamente' })
  createModAuth(@Body() dto: CreateUsuarioModAuthDto, @CurrentUser() user: any) {
    return this.service.createModAuth(dto, user.usuario);
  }

  @Put('mod-auth/:id')
  @ApiOperation({ summary: 'Actualizar autenticación de módulo' })
  @ApiResponse({ status: 200, description: 'Autenticación de módulo actualizada exitosamente' })
  updateModAuth(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuarioModAuthDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateModAuth(id, empresaId, dto, user.usuario);
  }

  @Delete('mod-auth/:id')
  @ApiOperation({ summary: 'Eliminar autenticación de módulo' })
  @ApiResponse({ status: 200, description: 'Autenticación de módulo eliminada exitosamente' })
  removeModAuth(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeModAuth(id, empresaId);
  }
}
