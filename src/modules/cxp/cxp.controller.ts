import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CxpService } from './cxp.service';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';
import { CreateCarteraCtaDto, UpdateCarteraCtaDto } from './dto/carteracta.dto';
import { CreateProveedorInfoDto, UpdateProveedorInfoDto } from './dto/proveedorinfo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('CxP')
@ApiBearerAuth()
@Controller('cxp')
@UseGuards(JwtAuthGuard)
export class CxpController {
  constructor(private readonly service: CxpService) {}

  @Get('proveedores')
  @ApiOperation({ summary: 'Listar proveedores' })
  @ApiResponse({ status: 200, description: 'Lista de proveedores obtenida exitosamente' })
  findAllProveedores(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProveedores(empresaId);
  }

  @Get('proveedores-pag')
  @ApiOperation({ summary: 'Listar proveedores paginados' })
  findProveedoresPag(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    return this.service.findProveedoresPag(empresaId, Number(page) || 1, Number(limit) || 15, q || '');
  }

  @Get('proveedores/dni-existe')
  @ApiOperation({ summary: 'Verificar si el DNI ya existe en proveedores de la empresa (llave maestra)' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  verificarDniProveedor(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('dni') dni: string,
    @Query('excluirId') excluirId?: string,
  ) {
    return this.service.verificarDniProveedor(empresaId, dni, excluirId ? Number(excluirId) : undefined);
  }

  @Get('proveedores/:id')
  @ApiOperation({ summary: 'Obtener proveedor por ID' })
  @ApiResponse({ status: 200, description: 'Proveedor encontrado' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  findProveedor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProveedor(id, empresaId);
  }

  @Post('proveedores')
  @ApiOperation({ summary: 'Crear proveedor' })
  @ApiResponse({ status: 201, description: 'Proveedor creado exitosamente' })
  createProveedor(@Body() dto: CreateProveedorDto, @CurrentUser() user: any) {
    return this.service.createProveedor(dto, user.usuario);
  }

  @Put('proveedores/:id')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  @ApiResponse({ status: 200, description: 'Proveedor actualizado exitosamente' })
  updateProveedor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateProveedorDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProveedor(id, empresaId, dto, user.usuario);
  }

  @Get('compras')
  @ApiOperation({ summary: 'Listar compras' })
  @ApiResponse({ status: 200, description: 'Lista de compras obtenida exitosamente' })
  findAllCompras(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCompras(empresaId);
  }

  @Get('compras/:id')
  @ApiOperation({ summary: 'Obtener compra por ID' })
  @ApiResponse({ status: 200, description: 'Compra encontrada' })
  @ApiResponse({ status: 404, description: 'Compra no encontrada' })
  findCompra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCompra(id, empresaId);
  }

  @Get('compras-pag')
  @ApiOperation({ summary: 'Facturas pendientes de pago' })
  @ApiResponse({ status: 200, description: 'Lista de facturas pendientes de pago' })
  findComprasPendientesPago(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findComprasPendientesPago(empresaId);
  }

  @Get('compras-det')
  @ApiOperation({ summary: 'Listar detalle de compras' })
  @ApiResponse({ status: 200, description: 'Lista de detalle de compras obtenida exitosamente' })
  findAllComprasDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllComprasDet(empresaId);
  }

  @Get('compras/:id/detalles')
  @ApiOperation({ summary: 'Obtener detalles de una compra' })
  findComprasDetByCompra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findComprasDetByCompra(id, empresaId);
  }

  @Post('compras')
  @ApiOperation({ summary: 'Crear compra con detalles' })
  @ApiResponse({ status: 201, description: 'Compra creada exitosamente' })
  createCompra(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCompra(dto, user.usuario);
  }

  @Put('compras/:id')
  @ApiOperation({ summary: 'Actualizar compra' })
  @ApiResponse({ status: 200, description: 'Compra actualizada exitosamente' })
  updateCompra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCompra(id, empresaId, dto, user.usuario);
  }

  @Put('compras/:id/anular')
  @ApiOperation({ summary: 'Anular compra (reversa kardex + movimiento CxP)' })
  @ApiResponse({ status: 200, description: 'Compra anulada exitosamente' })
  deleteCompra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.deleteCompra(id, empresaId, user.usuario);
  }

  @Put('compras/:id/contabilizar')
  @ApiOperation({ summary: 'Contabilizar una compra ya procesada (genera partida y enlaces)' })
  contabilizarCompra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.contabilizarCompra(id, empresaId, user.usuario, user.idsucursal);
  }

  @Put('compras/:id/procesar')
  @ApiOperation({ summary: 'Procesar compra (kardex entrada + movimiento CxP débito)' })
  @ApiResponse({ status: 200, description: 'Compra procesada exitosamente' })
  procesarCompra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.procesarCompra(id, empresaId, user.usuario, user.idsucursal);
  }

  @Get('movimientos')
  @ApiOperation({ summary: 'Listar movimientos de cuentas por pagar' })
  @ApiResponse({ status: 200, description: 'Lista de movimientos obtenida exitosamente' })
  findAllMovimientos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMovimientos(empresaId);
  }

  @Get('movimientos/proveedor/:proveedorId')
  @ApiOperation({ summary: 'Listar movimientos por proveedor' })
  findMovimientosByProveedor(
    @Param('proveedorId', ParseIntPipe) proveedorId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMovimientosByProveedor(proveedorId, empresaId);
  }

  @Get('movimientos/:id')
  @ApiOperation({ summary: 'Obtener movimiento CxP por ID' })
  @ApiResponse({ status: 200, description: 'Movimiento encontrado' })
  findMovimiento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMovimiento(id, empresaId);
  }

  @Post('movimientos')
  @ApiOperation({ summary: 'Crear movimiento' })
  createMovimiento(@Body() dto: any, @CurrentUser() user: any) {
    dto.Idsucursal = user.idsucursal;
    return this.service.createMovimiento(dto, user.usuario);
  }

  @Get('historicos')
  @ApiOperation({ summary: 'Listar históricos de cuentas por pagar' })
  @ApiResponse({ status: 200, description: 'Lista de históricos obtenida exitosamente' })
  findAllHistoricos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllHistoricos(empresaId);
  }

  @Get('historicos/filtros')
  @ApiOperation({ summary: 'Históricos con filtros (DNI, proveedor, fechas)' })
  @ApiResponse({ status: 200, description: 'Lista filtrada obtenida exitosamente' })
  findHistoricoConFiltros(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('dni') dni?: string,
    @Query('proveedor') proveedor?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.service.findHistoricoConFiltros(empresaId, dni, proveedor, fechaDesde, fechaHasta);
  }

  @Get('saldos-av')
  @ApiOperation({ summary: 'Listar saldos anticipo de proveedores' })
  @ApiResponse({ status: 200, description: 'Lista de saldos obtenida exitosamente' })
  findAllSaldosAv(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllSaldosAv(empresaId);
  }

  @Delete('compras-det/:id')
  @ApiOperation({ summary: 'Eliminar detalle de compra' })
  deleteCompraDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.deleteCompraDet(id, empresaId);
  }

  @Post('compras-det')
  @ApiOperation({ summary: 'Crear detalle de compra' })
  @ApiResponse({ status: 201, description: 'Detalle creado exitosamente' })
  createCompraDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCompraDet(dto, user.usuario);
  }

  @Put('compras-det/:id')
  @ApiOperation({ summary: 'Actualizar detalle de compra' })
  @ApiResponse({ status: 200, description: 'Detalle actualizado exitosamente' })
  updateCompraDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCompraDet(id, empresaId, dto, user.usuario);
  }

  // ========== Cartera Contable por Proveedor (cxpcarteracta) ==========

  @Get('carteras-cta')
  @ApiOperation({ summary: 'Listar carteras contables por proveedor' })
  @ApiResponse({ status: 200, description: 'Lista obtenida exitosamente' })
  findAllCarterasCta(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCarterasCta(empresaId);
  }

  @Get('carteras-cta/:id')
  @ApiOperation({ summary: 'Obtener cartera contable de proveedor por ID' })
  @ApiResponse({ status: 200, description: 'Registro encontrado' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  findCarteraCta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCarteraCta(id, empresaId);
  }

  @Post('carteras-cta')
  @ApiOperation({ summary: 'Asignar cartera contable a proveedor' })
  @ApiResponse({ status: 201, description: 'Registro creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Proveedor/cartera inválido o asignación duplicada' })
  createCarteraCta(@Body() dto: CreateCarteraCtaDto, @CurrentUser() user: any) {
    return this.service.createCarteraCta(dto, user.usuario, user.idsucursal);
  }

  @Put('carteras-cta/:id')
  @ApiOperation({ summary: 'Actualizar cartera contable de proveedor' })
  @ApiResponse({ status: 200, description: 'Registro actualizado exitosamente' })
  updateCarteraCta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCarteraCtaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCarteraCta(id, empresaId, dto, user.usuario, user.idsucursal);
  }

  @Put('carteras-cta/:id/remove')
  @ApiOperation({ summary: 'Eliminar cartera contable de proveedor (físico)' })
  @ApiResponse({ status: 200, description: 'Registro eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  removeCarteraCta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCarteraCta(id, empresaId);
  }

  // ========== Info de Proveedores (proveedorinfo) ==========

  @Get('proveedor-info')
  @ApiOperation({ summary: 'Listar información de proveedores (correo/celular/dirección)' })
  @ApiResponse({ status: 200, description: 'Lista obtenida exitosamente' })
  findAllProveedorInfo(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProveedorInfo(empresaId);
  }

  @Get('proveedor-info/proveedor/:proveedorId')
  @ApiOperation({ summary: 'Información por proveedor' })
  @ApiResponse({ status: 200, description: 'Lista obtenida exitosamente' })
  findProveedorInfoByProveedor(
    @Param('proveedorId', ParseIntPipe) proveedorId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProveedorInfoByProveedor(proveedorId, empresaId);
  }

  @Get('proveedor-info/:id')
  @ApiOperation({ summary: 'Obtener información de proveedor por ID' })
  @ApiResponse({ status: 200, description: 'Registro encontrado' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  findProveedorInfo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProveedorInfo(id, empresaId);
  }

  @Post('proveedor-info')
  @ApiOperation({ summary: 'Crear información de proveedor' })
  @ApiResponse({ status: 201, description: 'Registro creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Proveedor inválido o tipo duplicado' })
  createProveedorInfo(@Body() dto: CreateProveedorInfoDto, @CurrentUser() user: any) {
    return this.service.createProveedorInfo(dto, user.usuario);
  }

  @Put('proveedor-info/:id')
  @ApiOperation({ summary: 'Actualizar información de proveedor' })
  @ApiResponse({ status: 200, description: 'Registro actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Proveedor inválido o tipo duplicado' })
  updateProveedorInfo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateProveedorInfoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProveedorInfo(id, empresaId, dto, user.usuario);
  }

  @Put('proveedor-info/:id/remove')
  @ApiOperation({ summary: 'Desactivar información de proveedor (sn_activo = N)' })
  @ApiResponse({ status: 200, description: 'Registro desactivado exitosamente' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  removeProveedorInfo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.removeProveedorInfo(id, empresaId, user.usuario);
  }
}
