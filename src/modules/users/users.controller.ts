import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';
import { CreateUsuariosModuleDto, UpdateUsuariosModuleDto } from './dto/usuarios-module.dto';
import { CreateUsuarioMnuItemDto, UpdateUsuarioMnuItemDto, BulkCreateMnuItemsDto, ClonarMenuUsuarioDto } from './dto/usuarios-mnuitem.dto';
import { CreateUsuariosScriptsDto, UpdateUsuariosScriptsDto } from './dto/usuarios-scripts.dto';
import { CreateUsuarioModAuthDto, UpdateUsuarioModAuthDto } from './dto/usuario-modauth.dto';
import { CreateUsuarioRolDto, UpdateUsuarioRolDto } from './dto/usuario-rol.dto';
import { CreateUsuarioInfoDto, UpdateUsuarioInfoDto } from './dto/usuario-info.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags("Usuarios")
@ApiBearerAuth()
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // ===== Usuarios (rutas con :usuario al final, después de las estáticas) =====

  @Get()
  @ApiOperation({ summary: "Listar usuarios" })
  @ApiResponse({
    status: 200,
    description: "Lista de usuarios obtenida exitosamente",
  })
  findAll(
    @Query("empresaId", ParseIntPipe) empresaId: number,
    @Query("todos") todos?: string,
  ) {
    if (todos === 'true' || todos === '1') {
      return this.service.findAllGlobal();
    }
    return this.service.findAll(empresaId);
  }

  @Post()
  @ApiOperation({ summary: "Crear usuario" })
  @ApiResponse({ status: 201, description: "Usuario creado exitosamente" })
  create(@Body() dto: CreateUsuarioDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.usuario);
  }

  // ===== UsuariosModule =====

  @Get("modules")
  @ApiOperation({ summary: "Listar módulos de usuario" })
  @ApiResponse({
    status: 200,
    description: "Lista de módulos de usuario obtenida exitosamente",
  })
  findAllModules(@Query("empresaId", ParseIntPipe) empresaId: number) {
    return this.service.findAllModules(empresaId);
  }

  @Get("modules/:id")
  @ApiOperation({ summary: "Obtener módulo de usuario por ID" })
  @ApiResponse({ status: 200, description: "Módulo de usuario encontrado" })
  @ApiResponse({ status: 404, description: "Módulo de usuario no encontrado" })
  findModule(
    @Param("id", ParseIntPipe) id: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
  ) {
    return this.service.findModule(id, empresaId);
  }

  @Post("modules")
  @ApiOperation({ summary: "Crear módulo de usuario" })
  @ApiResponse({
    status: 201,
    description: "Módulo de usuario creado exitosamente",
  })
  createModule(@Body() dto: CreateUsuariosModuleDto, @CurrentUser() user: any) {
    return this.service.createModule(dto, user.usuario);
  }

  @Put("modules/:id")
  @ApiOperation({ summary: "Actualizar módulo de usuario" })
  @ApiResponse({
    status: 200,
    description: "Módulo de usuario actualizado exitosamente",
  })
  updateModule(
    @Param("id", ParseIntPipe) id: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuariosModuleDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateModule(id, empresaId, dto, user.usuario);
  }

  @Delete("modules/:id")
  @ApiOperation({ summary: "Eliminar módulo de usuario" })
  @ApiResponse({
    status: 200,
    description: "Módulo de usuario eliminado exitosamente",
  })
  removeModule(
    @Param("id", ParseIntPipe) id: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeModule(id, empresaId);
  }

  // ===== UsuarioMnuItem =====

  @Get("menu-items")
  @ApiOperation({ summary: "Listar items de menú de usuario" })
  @ApiResponse({
    status: 200,
    description: "Lista de items de menú obtenida exitosamente",
  })
  findAllMnuItems(
    @Query("empresaId", ParseIntPipe) empresaId: number,
    @Query("usuario") usuario?: string,
  ) {
    return this.service.findAllMnuItems(empresaId, usuario);
  }

  @Get("menu-items/:id")
  @ApiOperation({ summary: "Obtener item de menú por ID" })
  @ApiResponse({ status: 200, description: "Item de menú encontrado" })
  @ApiResponse({ status: 404, description: "Item de menú no encontrado" })
  findMnuItem(
    @Param("id", ParseIntPipe) id: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMnuItem(id, empresaId);
  }

  @Post("menu-items/bulk")
  @ApiOperation({ summary: "Importar items de menú masivamente desde CSV" })
  @ApiResponse({ status: 201, description: "Items importados exitosamente" })
  bulkCreateMnuItems(
    @Body() dto: BulkCreateMnuItemsDto,
    @CurrentUser() user: any,
  ) {
    return this.service.bulkCreateMnuItems(dto, user.usuario);
  }

  @Post("menu-items/clonar")
  @ApiOperation({
    summary: "Clonar menú de la plantilla (admin) hacia un usuario",
  })
  @ApiResponse({
    status: 201,
    description: "Menú clonado (solo items faltantes)",
  })
  clonarMenuUsuario(
    @Body() dto: ClonarMenuUsuarioDto,
    @CurrentUser() user: any,
  ) {
    return this.service.clonarMenuUsuario(dto, user.usuario);
  }

  @Post("menu-items")
  @ApiOperation({ summary: "Crear item de menú" })
  @ApiResponse({ status: 201, description: "Item de menú creado exitosamente" })
  createMnuItem(
    @Body() dto: CreateUsuarioMnuItemDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createMnuItem(dto, user.usuario);
  }

  @Put("menu-items/:id")
  @ApiOperation({ summary: "Actualizar item de menú" })
  @ApiResponse({
    status: 200,
    description: "Item de menú actualizado exitosamente",
  })
  updateMnuItem(
    @Param("id", ParseIntPipe) id: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuarioMnuItemDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMnuItem(id, empresaId, dto, user.usuario);
  }

  @Delete("menu-items/:id")
  @ApiOperation({ summary: "Eliminar item de menú" })
  @ApiResponse({
    status: 200,
    description: "Item de menú eliminado exitosamente",
  })
  removeMnuItem(
    @Param("id", ParseIntPipe) id: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeMnuItem(id, empresaId);
  }

  // ===== UsuariosScripts =====

  @Get("scripts")
  @ApiOperation({ summary: "Listar scripts de usuario" })
  @ApiResponse({
    status: 200,
    description: "Lista de scripts obtenida exitosamente",
  })
  findAllScripts(@Query("empresaId", ParseIntPipe) empresaId: number) {
    return this.service.findAllScripts(empresaId);
  }

  @Get("scripts/:id")
  @ApiOperation({ summary: "Obtener script por ID" })
  @ApiResponse({ status: 200, description: "Script encontrado" })
  @ApiResponse({ status: 404, description: "Script no encontrado" })
  findScript(
    @Param("id", ParseIntPipe) id: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
  ) {
    return this.service.findScript(id, empresaId);
  }

  @Post("scripts")
  @ApiOperation({ summary: "Crear script" })
  @ApiResponse({ status: 201, description: "Script creado exitosamente" })
  createScript(
    @Body() dto: CreateUsuariosScriptsDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createScript(dto, user.usuario);
  }

  @Put("scripts/:id")
  @ApiOperation({ summary: "Actualizar script" })
  @ApiResponse({ status: 200, description: "Script actualizado exitosamente" })
  updateScript(
    @Param("id", ParseIntPipe) id: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuariosScriptsDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateScript(id, empresaId, dto, user.usuario);
  }

  @Delete("scripts/:id")
  @ApiOperation({ summary: "Eliminar script" })
  @ApiResponse({ status: 200, description: "Script eliminado exitosamente" })
  removeScript(
    @Param("id", ParseIntPipe) id: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeScript(id, empresaId);
  }

  // ===== UsuarioModAuth =====

  @Get("mod-auth")
  @ApiOperation({ summary: "Listar autenticaciones de módulo" })
  @ApiResponse({
    status: 200,
    description: "Lista de autenticaciones de módulo obtenida exitosamente",
  })
  findAllModAuth(@Query("empresaId", ParseIntPipe) empresaId: number) {
    return this.service.findAllModAuth(empresaId);
  }

  @Get("mod-auth/:id")
  @ApiOperation({ summary: "Obtener autenticación de módulo por ID" })
  @ApiResponse({
    status: 200,
    description: "Autenticación de módulo encontrada",
  })
  @ApiResponse({
    status: 404,
    description: "Autenticación de módulo no encontrada",
  })
  findModAuth(
    @Param("id", ParseIntPipe) id: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
  ) {
    return this.service.findModAuth(id, empresaId);
  }

  @Post("mod-auth")
  @ApiOperation({ summary: "Crear autenticación de módulo" })
  @ApiResponse({
    status: 201,
    description: "Autenticación de módulo creada exitosamente",
  })
  createModAuth(
    @Body() dto: CreateUsuarioModAuthDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createModAuth(dto, user.usuario);
  }

  @Put("mod-auth/:id")
  @ApiOperation({ summary: "Actualizar autenticación de módulo" })
  @ApiResponse({
    status: 200,
    description: "Autenticación de módulo actualizada exitosamente",
  })
  updateModAuth(
    @Param("id", ParseIntPipe) id: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuarioModAuthDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateModAuth(id, empresaId, dto, user.usuario);
  }

  @Delete("mod-auth/:id")
  @ApiOperation({ summary: "Eliminar autenticación de módulo" })
  @ApiResponse({
    status: 200,
    description: "Autenticación de módulo eliminada exitosamente",
  })
  removeModAuth(
    @Param("id", ParseIntPipe) id: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeModAuth(id, empresaId);
  }

  // ===== Roles de usuario (tusuarios_rol) =====

  @Get("roles/tipos")
  @ApiOperation({ summary: "Catálogo de roles disponibles (ttipo_rol)" })
  @ApiResponse({
    status: 200,
    description: "Catálogo de roles obtenido exitosamente",
  })
  findAllTiposRol(@Query("empresaId", ParseIntPipe) empresaId: number) {
    return this.service.findAllTiposRol(empresaId);
  }

  @Get("roles")
  @ApiOperation({ summary: "Listar asignaciones de rol de usuario" })
  @ApiResponse({
    status: 200,
    description: "Lista de roles de usuario obtenida exitosamente",
  })
  findAllRoles(@Query("empresaId", ParseIntPipe) empresaId: number) {
    return this.service.findAllRoles(empresaId);
  }

  @Get("roles/:id")
  @ApiOperation({ summary: "Obtener asignación de rol por ID" })
  @ApiResponse({ status: 200, description: "Asignación de rol encontrada" })
  @ApiResponse({ status: 404, description: "Asignación de rol no encontrada" })
  findRole(
    @Param("id", ParseIntPipe) id: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
  ) {
    return this.service.findRole(id, empresaId);
  }

  @Post("roles")
  @ApiOperation({ summary: "Asignar rol a usuario" })
  @ApiResponse({ status: 201, description: "Rol asignado exitosamente" })
  @ApiResponse({ status: 409, description: "El usuario ya tiene ese rol" })
  createRole(@Body() dto: CreateUsuarioRolDto, @CurrentUser() user: any) {
    return this.service.createRole(dto, user.usuario);
  }

  @Put("roles/:id")
  @ApiOperation({ summary: "Actualizar asignación de rol" })
  @ApiResponse({ status: 200, description: "Rol actualizado exitosamente" })
  updateRole(
    @Param("id", ParseIntPipe) id: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuarioRolDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateRole(id, empresaId, dto, user.usuario);
  }

  @Delete("roles/:id")
  @ApiOperation({ summary: "Eliminar asignación de rol" })
  @ApiResponse({ status: 200, description: "Rol eliminado exitosamente" })
  removeRole(
    @Param("id", ParseIntPipe) id: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeRole(id, empresaId);
  }

  // ===== Info extendida del usuario (tusuariosinfoinfo) =====

  @Get("info")
  @ApiOperation({ summary: "Listar info extendida de usuarios de la empresa" })
  @ApiResponse({
    status: 200,
    description: "Lista de info de usuarios obtenida exitosamente",
  })
  findAllInfo(@Query("empresaId", ParseIntPipe) empresaId: number) {
    return this.service.findAllInfo(empresaId);
  }

  @Get("info/:usuarioId")
  @ApiOperation({
    summary: "Obtener info extendida de un usuario por usuarioId",
  })
  @ApiResponse({ status: 200, description: "Info de usuario encontrada" })
  @ApiResponse({ status: 404, description: "Info de usuario no encontrada" })
  findInfo(
    @Param("usuarioId", ParseIntPipe) usuarioId: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
  ) {
    return this.service.findInfo(usuarioId, empresaId);
  }

  @Post("info")
  @ApiOperation({ summary: "Crear info extendida de un usuario" })
  @ApiResponse({
    status: 201,
    description: "Info de usuario creada exitosamente",
  })
  @ApiResponse({
    status: 404,
    description: "Usuario no encontrado en la empresa",
  })
  @ApiResponse({
    status: 409,
    description: "El usuario ya tiene info o el documento está duplicado",
  })
  createInfo(@Body() dto: CreateUsuarioInfoDto, @CurrentUser() user: any) {
    return this.service.createInfo(dto, user.usuario);
  }

  @Put("info/:usuarioId")
  @ApiOperation({ summary: "Actualizar info extendida de un usuario" })
  @ApiResponse({
    status: 200,
    description: "Info de usuario actualizada exitosamente",
  })
  @ApiResponse({ status: 404, description: "Info de usuario no encontrada" })
  @ApiResponse({ status: 409, description: "El documento está duplicado" })
  updateInfo(
    @Param("usuarioId", ParseIntPipe) usuarioId: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuarioInfoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateInfo(usuarioId, empresaId, dto, user.usuario);
  }

  @Delete("info/:usuarioId")
  @ApiOperation({ summary: "Eliminar info extendida de un usuario" })
  @ApiResponse({
    status: 200,
    description: "Info de usuario eliminada exitosamente",
  })
  @ApiResponse({ status: 404, description: "Info de usuario no encontrada" })
  removeInfo(
    @Param("usuarioId", ParseIntPipe) usuarioId: number,
    @Query("empresaId", ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeInfo(usuarioId, empresaId);
  }

  // ===== Rutas parametrizadas de :usuario SIEMPRE al final =====

  @Get(":usuario")
  @ApiOperation({ summary: "Obtener usuario por ID" })
  @ApiResponse({ status: 200, description: "Usuario encontrado" })
  @ApiResponse({ status: 404, description: "Usuario no encontrado" })
  findOne(
    @Param("usuario") usuario: string,
    @Query("empresaId", ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOne(usuario, empresaId);
  }

  @Put("password/actualizar")
  @ApiOperation({ summary: "Cambiar contraseña del usuario actual" })
  @ApiResponse({
    status: 200,
    description: "Contraseña actualizada exitosamente",
  })
  cambiarPassword(
    @Body() dto: { passwordNueva: string },
    @CurrentUser() user: any,
  ) {
    return this.service.cambiarPassword(
      user.usuario,
      user.empresaId,
      dto.passwordNueva,
      user.usuario,
    );
  }

  @Put(":usuario")
  @ApiOperation({ summary: "Actualizar usuario" })
  @ApiResponse({ status: 200, description: "Usuario actualizado exitosamente" })
  update(
    @Param("usuario") usuario: string,
    @Query("empresaId", ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuarioDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(usuario, empresaId, dto, user.usuario);
  }
}
