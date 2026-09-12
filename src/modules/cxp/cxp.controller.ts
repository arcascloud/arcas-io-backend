import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CxpService } from './cxp.service';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';
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

  @Get('proveedores-dir')
  @ApiOperation({ summary: 'Listar direcciones de proveedores' })
  @ApiResponse({ status: 200, description: 'Lista de direcciones de proveedores obtenida exitosamente' })
  findAllProveedorDirs(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProveedorDirs(empresaId);
  }

  @Get('proveedores-tel')
  @ApiOperation({ summary: 'Listar teléfonos de proveedores' })
  @ApiResponse({ status: 200, description: 'Lista de teléfonos de proveedores obtenida exitosamente' })
  findAllProveedorTels(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProveedorTels(empresaId);
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

  @Put('compras/:id/procesar')
  @ApiOperation({ summary: 'Procesar compra (kardex entrada + movimiento CxP débito)' })
  @ApiResponse({ status: 200, description: 'Compra procesada exitosamente' })
  procesarCompra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.procesarCompra(id, empresaId, user.usuario);
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

  @Post('movimientos')
  @ApiOperation({ summary: 'Crear movimiento' })
  createMovimiento(@Body() dto: any, @CurrentUser() user: any) {
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
}
