import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateEmpresaDto, UpdateEmpresaDto } from './dto/empresa.dto';
import { CreateEmpresaDetDto, UpdateEmpresaDetDto } from './dto/empresasdet.dto';
import { CreateCorrelativoDto, UpdateCorrelativoDto } from './dto/correlativos.dto';
import { CreateEmpresaLogoDto, UpdateEmpresaLogoDto } from './dto/empresaslogo.dto';
import { CreateImpresoraDto, UpdateImpresoraDto } from './dto/impresoras.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Empresas')
@ApiBearerAuth()
@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  // ============================================================
  //  RUTAS ESTÁTICAS PRIMERO (antes de :id)
  // ============================================================

  // ===== Empresas =====

  @Get()
  @ApiOperation({ summary: 'Listar empresas' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Crear empresa' })
  create(@Body() dto: CreateEmpresaDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.usuario);
  }

  // ===== EmpresaDet =====

  @Get('det')
  @ApiOperation({ summary: 'Listar datos de empresa (RTN, tel, dir, etc)' })
  findAllDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDet(empresaId);
  }

  @Post('det')
  @ApiOperation({ summary: 'Crear dato de empresa' })
  createDet(
    @Body() dto: CreateEmpresaDetDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createDet(dto.empresaId!, dto, user.usuario);
  }

  // ===== Correlativos (CAI) =====

  @Get('correlativos')
  @ApiOperation({ summary: 'Listar correlativos de una empresa' })
  findAllCorr(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCorr(empresaId);
  }

  @Get('correlativos/siguiente-nro')
  @ApiOperation({ summary: 'Obtener siguiente numero de factura' })
  findNextNroFactura(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('idsucursal', ParseIntPipe) idsucursal: number,
  ) {
    return this.service.findNextNroFactura(empresaId, idsucursal);
  }

  @Get('correlativos/estado')
  @ApiOperation({ summary: 'Estado del rango de correlativos (disponibles, alertas)' })
  findEstadoCorrelativo(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findEstadoCorrelativo(empresaId);
  }

  @Post('correlativos')
  @ApiOperation({ summary: 'Crear correlativo' })
  createCorr(
    @Body() dto: CreateCorrelativoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createCorr(dto.empresaId!, dto, user.usuario);
  }

  // ===== Sucursales =====

  @Get('sucursales')
  @ApiOperation({ summary: 'Listar sucursales de una empresa' })
  findAllSucursales(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllSucursales(empresaId);
  }

  @Post('sucursales')
  @ApiOperation({ summary: 'Crear sucursal' })
  createSucursal(
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.createSucursal(dto.empresaId, dto, user.usuario);
  }

  // ===== Logo =====

  @Get('logo')
  @ApiOperation({ summary: 'Obtener logo de la empresa' })
  findLogo(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findLogo(empresaId);
  }

  @Post('logo')
  @ApiOperation({ summary: 'Crear/subir logo de la empresa' })
  createLogo(
    @Body() dto: CreateEmpresaLogoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createLogo(dto.empresaId, dto, user.usuario);
  }

  // ===== Impresoras =====

  @Get('impresoras')
  @ApiOperation({ summary: 'Listar impresoras de una empresa' })
  findAllImpresoras(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllImpresoras(empresaId);
  }

  @Post('impresoras')
  @ApiOperation({ summary: 'Crear impresora' })
  createImpresora(
    @Body() dto: CreateImpresoraDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createImpresora(dto.empresaId, dto, user.usuario);
  }

  // ============================================================
  //  RUTAS CON PARÁMETRO :id DESPUÉS
  // ============================================================

  @Get(':id')
  @ApiOperation({ summary: 'Obtener empresa por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar empresa' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmpresaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.usuario);
  }

  // ===== EmpresaDet (con parámetro) =====

  @Get('det/:id')
  @ApiOperation({ summary: 'Obtener dato de empresa por ID' })
  findOneDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOneDet(id, empresaId);
  }

  @Put('det/:id')
  @ApiOperation({ summary: 'Actualizar dato de empresa' })
  updateDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateEmpresaDetDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDet(id, empresaId, dto, user.usuario);
  }

  @Delete('det/:id')
  @ApiOperation({ summary: 'Eliminar dato de empresa' })
  removeDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeDet(id, empresaId);
  }

  // ===== Correlativos (con parámetro) =====

  @Get('correlativos/:id')
  @ApiOperation({ summary: 'Obtener correlativo por ID' })
  findOneCorr(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOneCorr(id, empresaId);
  }

  @Put('correlativos/:id')
  @ApiOperation({ summary: 'Actualizar correlativo' })
  updateCorr(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCorrelativoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCorr(id, empresaId, dto, user.usuario);
  }

  @Delete('correlativos/:id')
  @ApiOperation({ summary: 'Eliminar correlativo' })
  removeCorr(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCorr(id, empresaId);
  }

  // ===== Sucursales (con parámetro) =====

  @Put('sucursales/:id')
  @ApiOperation({ summary: 'Actualizar sucursal' })
  updateSucursal(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateSucursal(id, dto, user.usuario);
  }

  // ===== Logo (con parámetro) =====

  @Put('logo/:id')
  @ApiOperation({ summary: 'Actualizar logo' })
  updateLogo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmpresaLogoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateLogo(id, dto, user.usuario);
  }

  @Delete('logo/:id')
  @ApiOperation({ summary: 'Eliminar logo' })
  removeLogo(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeLogo(id);
  }

  // ===== Impresoras (con parámetro) =====

  @Put('impresoras/:id')
  @ApiOperation({ summary: 'Actualizar impresora' })
  updateImpresora(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateImpresoraDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateImpresora(id, dto, user.usuario);
  }

  @Delete('impresoras/:id')
  @ApiOperation({ summary: 'Eliminar impresora' })
  removeImpresora(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeImpresora(id);
  }
}
