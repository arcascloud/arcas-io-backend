import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ParametrosService } from './parametros.service';
import { CreateSimpleParamDto, UpdateSimpleParamDto } from './dto/simple-param.dto';
import { CreateMonedaDto, UpdateMonedaDto } from './dto/moneda.dto';
import { CreateGestorDto, UpdateGestorDto } from './dto/gestor.dto';
import { CreateImpuestoDto, UpdateImpuestoDto } from './dto/impuesto.dto';
import { CreateParamFacDto, UpdateParamFacDto } from './dto/param-fac.dto';
import { CreateParamInvDto, UpdateParamInvDto } from './dto/param-inv.dto';
import { CreateParamConDto, UpdateParamConDto } from './dto/param-con.dto';
import { CreateParamCxcDto, UpdateParamCxcDto } from './dto/param-cxc.dto';
import { CreateParamCxpDto, UpdateParamCxpDto } from './dto/param-cxp.dto';
import { CreateParamPlaDto, UpdateParamPlaDto } from './dto/param-pla.dto';
import { CreateParamPresDto, UpdateParamPresDto } from './dto/param-pres.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Parámetros')
@ApiBearerAuth()
@Controller('parametros')
@UseGuards(JwtAuthGuard)
export class ParametrosController {
  @Get('tcotipodocumentofiscal')
  @ApiOperation({ summary: 'Listar tipos de documento fiscal' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllTiposDocFiscal(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTiposDocFiscal(empresaId);
  }

  constructor(private readonly service: ParametrosService) {}

  @Get('monedas')
  @ApiOperation({ summary: 'Listar monedas' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllMonedas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMonedas(empresaId);
  }

  @Get('monedas/:id')
  @ApiOperation({ summary: 'Obtener moneda' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findMoneda(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMoneda(id, empresaId);
  }

  @Post('monedas')
  @ApiOperation({ summary: 'Crear moneda' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createMoneda(@Body() dto: CreateMonedaDto, @CurrentUser() user: any) {
    return this.service.createMoneda(dto, user.usuario);
  }

  @Put('monedas/:id')
  @ApiOperation({ summary: 'Actualizar moneda' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateMoneda(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateMonedaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMoneda(id, empresaId, dto, user.usuario);
  }

  @Get('paises')
  @ApiOperation({ summary: 'Listar países' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllPaises(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPaises(empresaId);
  }

  @Get('paises/:id')
  @ApiOperation({ summary: 'Obtener país' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findPais(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPais(id, empresaId);
  }

  @Post('paises')
  @ApiOperation({ summary: 'Crear país' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createPais(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createPais(dto, user.usuario);
  }

  @Put('paises/:id')
  @ApiOperation({ summary: 'Actualizar país' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updatePais(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePais(id, empresaId, dto, user.usuario);
  }

  @Get('departamentos-pais')
  @ApiOperation({ summary: 'Listar departamentos por país' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllDeptoPais(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDeptoPais(empresaId);
  }

  @Get('departamentos-pais/:id')
  @ApiOperation({ summary: 'Obtener departamento' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findDeptoPais(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDeptoPais(id, empresaId);
  }

  @Post('departamentos-pais')
  @ApiOperation({ summary: 'Crear departamento' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createDeptoPais(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createDeptoPais(dto, user.usuario);
  }

  @Put('departamentos-pais/:id')
  @ApiOperation({ summary: 'Actualizar departamento' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateDeptoPais(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDeptoPais(id, empresaId, dto, user.usuario);
  }

  @Get('departamentos-empresa')
  @ApiOperation({ summary: 'Listar departamentos de empresa' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllDeptoEmpresa(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDeptoEmpresa(empresaId);
  }

  @Get('departamentos-empresa/:id')
  @ApiOperation({ summary: 'Obtener departamento de empresa' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findDeptoEmpresa(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDeptoEmpresa(id, empresaId);
  }

  @Post('departamentos-empresa')
  @ApiOperation({ summary: 'Crear departamento de empresa' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createDeptoEmpresa(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createDeptoEmpresa(dto, user.usuario);
  }

  @Put('departamentos-empresa/:id')
  @ApiOperation({ summary: 'Actualizar departamento de empresa' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateDeptoEmpresa(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDeptoEmpresa(id, empresaId, dto, user.usuario);
  }

  @Get('direcciones')
  @ApiOperation({ summary: 'Listar tipos de dirección' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllDirecciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDirecciones(empresaId);
  }

  @Get('direcciones/:id')
  @ApiOperation({ summary: 'Obtener tipo de dirección' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findDireccion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDireccion(id, empresaId);
  }

  @Post('direcciones')
  @ApiOperation({ summary: 'Crear tipo de dirección' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createDireccion(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createDireccion(dto, user.usuario);
  }

  @Put('direcciones/:id')
  @ApiOperation({ summary: 'Actualizar tipo de dirección' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateDireccion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDireccion(id, empresaId, dto, user.usuario);
  }

  @Get('estados')
  @ApiOperation({ summary: 'Listar estados' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllEstados(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllEstados(empresaId);
  }

  @Get('estados/:id')
  @ApiOperation({ summary: 'Obtener estado' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findEstado(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findEstado(id, empresaId);
  }

  @Post('estados')
  @ApiOperation({ summary: 'Crear estado' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createEstado(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createEstado(dto, user.usuario);
  }

  @Put('estados/:id')
  @ApiOperation({ summary: 'Actualizar estado' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateEstado(id, empresaId, dto, user.usuario);
  }

  @Get('formas-pago')
  @ApiOperation({ summary: 'Listar formas de pago' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllFormasPago(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFormasPago(empresaId);
  }

  @Get('formas-pago/:id')
  @ApiOperation({ summary: 'Obtener forma de pago' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findFormaPago(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFormaPago(id, empresaId);
  }

  @Post('formas-pago')
  @ApiOperation({ summary: 'Crear forma de pago' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createFormaPago(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createFormaPago(dto, user.usuario);
  }

  @Put('formas-pago/:id')
  @ApiOperation({ summary: 'Actualizar forma de pago' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateFormaPago(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFormaPago(id, empresaId, dto, user.usuario);
  }

  @Get('telefonos')
  @ApiOperation({ summary: 'Listar tipos de teléfono' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllTelefonos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTelefonos(empresaId);
  }

  @Get('telefonos/:id')
  @ApiOperation({ summary: 'Obtener tipo de teléfono' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findTelefono(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTelefono(id, empresaId);
  }

  @Post('telefonos')
  @ApiOperation({ summary: 'Crear tipo de teléfono' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createTelefono(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createTelefono(dto, user.usuario);
  }

  @Put('telefonos/:id')
  @ApiOperation({ summary: 'Actualizar tipo de teléfono' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateTelefono(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTelefono(id, empresaId, dto, user.usuario);
  }

  @Get('tarjetas-credito')
  @ApiOperation({ summary: 'Listar tarjetas de crédito' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllTarjetasCredito(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTarjetasCredito(empresaId);
  }

  @Get('tarjetas-credito/:id')
  @ApiOperation({ summary: 'Obtener tarjeta de crédito' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findTarjetaCredito(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTarjetaCredito(id, empresaId);
  }

  @Post('tarjetas-credito')
  @ApiOperation({ summary: 'Crear tarjeta de crédito' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createTarjetaCredito(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createTarjetaCredito(dto, user.usuario);
  }

  @Put('tarjetas-credito/:id')
  @ApiOperation({ summary: 'Actualizar tarjeta de crédito' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateTarjetaCredito(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTarjetaCredito(id, empresaId, dto, user.usuario);
  }

  @Get('pasatiempos')
  @ApiOperation({ summary: 'Listar pasatiempos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllPasatiempos() {
    return this.service.findAllPasatiempos();
  }

  @Get('pasatiempos/:id')
  @ApiOperation({ summary: 'Obtener pasatiempo' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findPasatiempo(@Param('id', ParseIntPipe) id: number) {
    return this.service.findPasatiempo(id);
  }

  @Post('pasatiempos')
  @ApiOperation({ summary: 'Crear pasatiempo' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createPasatiempo(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createPasatiempo(dto, user.usuario);
  }

  @Put('pasatiempos/:id')
  @ApiOperation({ summary: 'Actualizar pasatiempo' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updatePasatiempo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePasatiempo(id, dto, user.usuario);
  }

  @Get('zonas')
  @ApiOperation({ summary: 'Listar zonas' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllZonas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllZonas(empresaId);
  }

  @Get('zonas/:id')
  @ApiOperation({ summary: 'Obtener zona' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findZona(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findZona(id, empresaId);
  }

  @Post('zonas')
  @ApiOperation({ summary: 'Crear zona' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createZona(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createZona(dto, user.usuario);
  }

  @Put('zonas/:id')
  @ApiOperation({ summary: 'Actualizar zona' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateZona(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateZona(id, empresaId, dto, user.usuario);
  }

  @Get('gestores')
  @ApiOperation({ summary: 'Listar gestores de cobro' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllGestores(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllGestores(empresaId);
  }

  @Get('gestores/:id')
  @ApiOperation({ summary: 'Obtener gestor' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findGestor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findGestor(id, empresaId);
  }

  @Post('gestores')
  @ApiOperation({ summary: 'Crear gestor' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createGestor(@Body() dto: CreateGestorDto, @CurrentUser() user: any) {
    return this.service.createGestor(dto, user.usuario);
  }

  @Put('gestores/:id')
  @ApiOperation({ summary: 'Actualizar gestor' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateGestor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateGestorDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateGestor(id, empresaId, dto, user.usuario);
  }

  @Get('impuestos')
  @ApiOperation({ summary: 'Listar impuestos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllImpuestos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllImpuestos(empresaId);
  }

  @Get('impuestos/:id')
  @ApiOperation({ summary: 'Obtener impuesto' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findImpuesto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findImpuesto(id, empresaId);
  }

  @Post('impuestos')
  @ApiOperation({ summary: 'Crear impuesto' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createImpuesto(@Body() dto: CreateImpuestoDto, @CurrentUser() user: any) {
    return this.service.createImpuesto(dto, user.usuario);
  }

  @Put('impuestos/:id')
  @ApiOperation({ summary: 'Actualizar impuesto' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateImpuesto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateImpuestoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateImpuesto(id, empresaId, dto, user.usuario);
  }

  @Get('proformas')
  @ApiOperation({ summary: 'Listar proformas' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllProformas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProformas(empresaId);
  }

  @Get('proformas/:id')
  @ApiOperation({ summary: 'Obtener proforma' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findProforma(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProforma(id, empresaId);
  }

  @Post('proformas')
  @ApiOperation({ summary: 'Crear proforma' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createProforma(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createProforma(dto, user.usuario);
  }

  @Put('proformas/:id')
  @ApiOperation({ summary: 'Actualizar proforma' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateProforma(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProforma(id, empresaId, dto, user.usuario);
  }

  @Get('zonas-vta-cob')
  @ApiOperation({ summary: 'Listar zonas venta/cobro' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllZonasVtaCob(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllZonasVtaCob(empresaId);
  }

  @Get('zonas-vta-cob/:id')
  @ApiOperation({ summary: 'Obtener zona venta/cobro' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findZonaVtaCob(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findZonaVtaCob(id, empresaId);
  }

  @Post('zonas-vta-cob')
  @ApiOperation({ summary: 'Crear zona venta/cobro' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createZonaVtaCob(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createZonaVtaCob(dto, user.usuario);
  }

  @Put('zonas-vta-cob/:id')
  @ApiOperation({ summary: 'Actualizar zona venta/cobro' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateZonaVtaCob(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateZonaVtaCob(id, empresaId, dto, user.usuario);
  }

  @Get('param-bco')
  @ApiOperation({ summary: 'Obtener parámetros bancarios' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamBco(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamBco(empresaId);
  }

  @Put('param-bco')
  @ApiOperation({ summary: 'Guardar parámetros bancarios' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamBco(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamBco(empresaId, dto, user.usuario);
  }

  @Get('param-con')
  @ApiOperation({ summary: 'Obtener parámetros de contabilidad' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamCon(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamCon(empresaId);
  }

  @Put('param-con')
  @ApiOperation({ summary: 'Guardar parámetros de contabilidad' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamCon(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamConDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamCon(empresaId, dto, user.usuario);
  }

  @Get('param-cxc')
  @ApiOperation({ summary: 'Obtener parámetros de CxC' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamCxc(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamCxc(empresaId);
  }

  @Put('param-cxc')
  @ApiOperation({ summary: 'Guardar parámetros de CxC' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamCxc(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamCxcDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamCxc(empresaId, dto, user.usuario);
  }

  @Get('param-cxp')
  @ApiOperation({ summary: 'Obtener parámetros de CxP' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamCxp(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamCxp(empresaId);
  }

  @Put('param-cxp')
  @ApiOperation({ summary: 'Guardar parámetros de CxP' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamCxp(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamCxpDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamCxp(empresaId, dto, user.usuario);
  }

  @Get('param-fac')
  @ApiOperation({ summary: 'Obtener parámetros de facturación' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamFac(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamFac(empresaId);
  }

  @Put('param-fac')
  @ApiOperation({ summary: 'Guardar parámetros de facturación' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamFac(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamFacDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamFac(empresaId, dto, user.usuario);
  }

  @Get('param-inv')
  @ApiOperation({ summary: 'Obtener parámetros de inventario' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamInv(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamInv(empresaId);
  }

  @Put('param-inv')
  @ApiOperation({ summary: 'Guardar parámetros de inventario' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamInv(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamInvDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamInv(empresaId, dto, user.usuario);
  }

  @Get('param-pap')
  @ApiOperation({ summary: 'Obtener parámetros de papelería' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamPap(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamPap(empresaId);
  }

  @Put('param-pap')
  @ApiOperation({ summary: 'Guardar parámetros de papelería' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamPap(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamPap(empresaId, dto, user.usuario);
  }

  @Get('param-pla')
  @ApiOperation({ summary: 'Obtener parámetros de planilla' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamPla(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamPla(empresaId);
  }

  @Put('param-pla')
  @ApiOperation({ summary: 'Guardar parámetros de planilla' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamPla(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamPlaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamPla(empresaId, dto, user.usuario);
  }

  @Get('param-pres')
  @ApiOperation({ summary: 'Obtener parámetros de presupuesto' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamPres(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamPres(empresaId);
  }

  @Put('param-pres')
  @ApiOperation({ summary: 'Guardar parámetros de presupuesto' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamPres(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamPresDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamPres(empresaId, dto, user.usuario);
  }

  @Get('precios-vta')
  @ApiOperation({ summary: 'Listar precios de venta' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllPreciosVta(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPreciosVta(empresaId);
  }

  @Get('precios-vta/:id')
  @ApiOperation({ summary: 'Obtener precio de venta por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findPreciosVta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPreciosVta(id, empresaId);
  }
}
