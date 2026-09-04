import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FacturacionService } from './facturacion.service';
import {
  CreatePosFacMaeDto, UpdatePosFacMaeDto,
  CreatePosCotMaeDto, UpdatePosCotMaeDto,
  CreatePosPedMaeDto, UpdatePosPedMaeDto,
  CheckoutTiendaDto,
  CheckoutPedidoDto,
} from './dto/facturacion.dto';
import {
  CreatePosFacCajaDto, UpdatePosFacCajaDto,
} from './dto/posfaccaja.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('FacturaciÃ³n')
@ApiBearerAuth()
@Controller('facturacion')
@UseGuards(JwtAuthGuard)
export class FacturacionController {
  constructor(private readonly service: FacturacionService) {}

  // ===== Correlativos =====

  @Get('correlativos')
  @ApiOperation({ summary: 'Listar correlativos' })
  @ApiResponse({ status: 200, description: 'Lista de correlativos obtenida exitosamente' })
  findAllCorrelativos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCorrelativos(empresaId);
  }

  @Get('correlativos/:id')
  @ApiOperation({ summary: 'Obtener correlativo por ID' })
  @ApiResponse({ status: 200, description: 'Correlativo encontrado' })
  @ApiResponse({ status: 404, description: 'Correlativo no encontrado' })
  findCorrelativo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCorrelativo(id, empresaId);
  }

  @Post('correlativos')
  @ApiOperation({ summary: 'Crear correlativo' })
  @ApiResponse({ status: 201, description: 'Correlativo creado exitosamente' })
  createCorrelativo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCorrelativo(dto, user.usuario);
  }

  @Put('correlativos/:id')
  @ApiOperation({ summary: 'Actualizar correlativo' })
  @ApiResponse({ status: 200, description: 'Correlativo actualizado exitosamente' })
  updateCorrelativo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCorrelativo(id, empresaId, dto, user.usuario);
  }

  // ===== Facturas =====

  @Get('facturas')
  @ApiOperation({ summary: 'Listar facturas' })
  @ApiResponse({ status: 200, description: 'Lista de facturas obtenida exitosamente' })
  findAllFacturas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFacturas(empresaId);
  }

  @Get('facturas/:id')
  @ApiOperation({ summary: 'Obtener factura por ID' })
  @ApiResponse({ status: 200, description: 'Factura encontrada' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  findFactura(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFactura(id, empresaId);
  }

  @Get('facturas/:id/ticket')
  @ApiOperation({ summary: 'Obtener datos completos del ticket de factura' })
  @ApiResponse({ status: 200, description: 'Datos del ticket obtenidos' })
  findFacturaTicket(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacturaTicket(id, empresaId);
  }

  @Post('facturas')
  @ApiOperation({ summary: 'Crear factura' })
  @ApiResponse({ status: 201, description: 'Factura creada exitosamente' })
  createFactura(@Body() dto: CreatePosFacMaeDto, @CurrentUser() user: any) {
    return this.service.createFactura(dto, user.usuario);
  }

  @Put('facturas/:id')
  @ApiOperation({ summary: 'Actualizar factura' })
  @ApiResponse({ status: 200, description: 'Factura actualizada exitosamente' })
  updateFactura(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePosFacMaeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFactura(id, empresaId, dto, user.usuario);
  }

  @Post('facturas/:id/procesar-kardex')
  @ApiOperation({ summary: 'Procesar kardex de una factura (despuÃ©s de guardar detalles)' })
  @ApiResponse({ status: 200, description: 'Kardex procesado exitosamente' })
  procesarKardexFactura(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.service.procesarKardexFactura(id, user.usuario);
  }

  // ===== Facturas Detalle =====

  @Get('facturas-det')
  @ApiOperation({ summary: 'Listar detalle de facturas' })
  @ApiResponse({ status: 200, description: 'Lista de detalle de facturas obtenida exitosamente' })
  findAllFacturaDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFacturaDet(empresaId);
  }

  @Get('facturas-det/factura/:facturaId')
  @ApiOperation({ summary: 'Obtener detalles de factura por facturaId' })
  @ApiResponse({ status: 200, description: 'Detalles de factura encontrados' })
  findFacturaDetByFacturaId(
    @Param('facturaId', ParseIntPipe) facturaId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacturaDetByFacturaId(facturaId, empresaId);
  }

  @Get('facturas-det/:id')
  @ApiOperation({ summary: 'Obtener detalle de factura por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de factura encontrado' })
  @ApiResponse({ status: 404, description: 'Detalle de factura no encontrado' })
  findFacturaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacturaDet(id, empresaId);
  }

  @Post('facturas-det')
  @ApiOperation({ summary: 'Crear detalle de factura' })
  @ApiResponse({ status: 201, description: 'Detalle de factura creado exitosamente' })
  createFacturaDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createFacturaDet(dto, user.usuario);
  }

  @Put('facturas-det/:id')
  @ApiOperation({ summary: 'Actualizar detalle de factura' })
  @ApiResponse({ status: 200, description: 'Detalle de factura actualizado exitosamente' })
  updateFacturaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFacturaDet(id, empresaId, dto, user.usuario);
  }

  // ===== Facturas Anuladas =====

  @Get('facturas-anul')
  @ApiOperation({ summary: 'Listar facturas anuladas' })
  @ApiResponse({ status: 200, description: 'Lista de facturas anuladas obtenida exitosamente' })
  findAllFacturaAnul(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFacturaAnul(empresaId);
  }

  @Get('facturas-anul/:id')
  @ApiOperation({ summary: 'Obtener factura anulada por ID' })
  @ApiResponse({ status: 200, description: 'Factura anulada encontrada' })
  @ApiResponse({ status: 404, description: 'Factura anulada no encontrada' })
  findFacturaAnul(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacturaAnul(id, empresaId);
  }

  @Post('facturas-anul')
  @ApiOperation({ summary: 'Crear factura anulada' })
  @ApiResponse({ status: 201, description: 'Factura anulada creada exitosamente' })
  createFacturaAnul(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createFacturaAnul(dto, user.usuario);
  }

  @Put('facturas-anul/:id')
  @ApiOperation({ summary: 'Actualizar factura anulada' })
  @ApiResponse({ status: 200, description: 'Factura anulada actualizada exitosamente' })
  updateFacturaAnul(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFacturaAnul(id, empresaId, dto, user.usuario);
  }

  // ===== Facturas Detalle Anuladas =====

  @Get('facturas-det-anul')
  @ApiOperation({ summary: 'Listar detalle de facturas anuladas' })
  @ApiResponse({ status: 200, description: 'Lista de detalle de facturas anuladas obtenida exitosamente' })
  findAllFacturaDetAnul(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFacturaDetAnul(empresaId);
  }

  @Get('facturas-det-anul/:id')
  @ApiOperation({ summary: 'Obtener detalle de factura anulada por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de factura anulada encontrado' })
  @ApiResponse({ status: 404, description: 'Detalle de factura anulada no encontrado' })
  findFacturaDetAnul(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacturaDetAnul(id, empresaId);
  }

  @Post('facturas-det-anul')
  @ApiOperation({ summary: 'Crear detalle de factura anulada' })
  @ApiResponse({ status: 201, description: 'Detalle de factura anulada creado exitosamente' })
  createFacturaDetAnul(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createFacturaDetAnul(dto, user.usuario);
  }

  @Put('facturas-det-anul/:id')
  @ApiOperation({ summary: 'Actualizar detalle de factura anulada' })
  @ApiResponse({ status: 200, description: 'Detalle de factura anulada actualizado exitosamente' })
  updateFacturaDetAnul(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFacturaDetAnul(id, empresaId, dto, user.usuario);
  }

  // ===== Cotizaciones =====

  @Get('cotizaciones')
  @ApiOperation({ summary: 'Listar cotizaciones' })
  @ApiResponse({ status: 200, description: 'Lista de cotizaciones obtenida exitosamente' })
  findAllCotizaciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCotizaciones(empresaId);
  }

  @Get('cotizaciones/:id')
  @ApiOperation({ summary: 'Obtener cotizaciÃ³n por ID' })
  @ApiResponse({ status: 200, description: 'CotizaciÃ³n encontrada' })
  @ApiResponse({ status: 404, description: 'CotizaciÃ³n no encontrada' })
  findCotizacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCotizacion(id, empresaId);
  }

  @Post('cotizaciones')
  @ApiOperation({ summary: 'Crear cotizaciÃ³n' })
  @ApiResponse({ status: 201, description: 'CotizaciÃ³n creada exitosamente' })
  createCotizacion(@Body() dto: CreatePosCotMaeDto, @CurrentUser() user: any) {
    return this.service.createCotizacion(dto, user.usuario);
  }

  @Put('cotizaciones/:id')
  @ApiOperation({ summary: 'Actualizar cotizaciÃ³n' })
  @ApiResponse({ status: 200, description: 'CotizaciÃ³n actualizada exitosamente' })
  updateCotizacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePosCotMaeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCotizacion(id, empresaId, dto, user.usuario);
  }

  // ===== Cotizaciones Detalle =====

  @Get('cotizaciones-det')
  @ApiOperation({ summary: 'Listar detalle de cotizaciones' })
  @ApiResponse({ status: 200, description: 'Lista de detalle de cotizaciones obtenida exitosamente' })
  findAllCotizacionDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCotizacionDet(empresaId);
  }

  @Get('cotizaciones-det/:id')
  @ApiOperation({ summary: 'Obtener detalle de cotizaciÃ³n por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de cotizaciÃ³n encontrado' })
  @ApiResponse({ status: 404, description: 'Detalle de cotizaciÃ³n no encontrado' })
  findCotizacionDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCotizacionDet(id, empresaId);
  }

  @Post('cotizaciones-det')
  @ApiOperation({ summary: 'Crear detalle de cotizaciÃ³n' })
  @ApiResponse({ status: 201, description: 'Detalle de cotizaciÃ³n creado exitosamente' })
  createCotizacionDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCotizacionDet(dto, user.usuario);
  }

  @Put('cotizaciones-det/:id')
  @ApiOperation({ summary: 'Actualizar detalle de cotizaciÃ³n' })
  @ApiResponse({ status: 200, description: 'Detalle de cotizaciÃ³n actualizado exitosamente' })
  updateCotizacionDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCotizacionDet(id, empresaId, dto, user.usuario);
  }

  // ===== Pedidos =====

  @Get('pedidos')
  @ApiOperation({ summary: 'Listar pedidos' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos obtenida exitosamente' })
  findAllPedidos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPedidos(empresaId);
  }

  @Get('pedidos/:id')
  @ApiOperation({ summary: 'Obtener pedido por ID' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  findPedido(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPedido(id, empresaId);
  }

  @Post('pedidos')
  @ApiOperation({ summary: 'Crear pedido' })
  @ApiResponse({ status: 201, description: 'Pedido creado exitosamente' })
  createPedido(@Body() dto: CreatePosPedMaeDto, @CurrentUser() user: any) {
    return this.service.createPedido(dto, user.usuario);
  }

  @Put('pedidos/:id')
  @ApiOperation({ summary: 'Actualizar pedido' })
  @ApiResponse({ status: 200, description: 'Pedido actualizado exitosamente' })
  updatePedido(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePosPedMaeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePedido(id, empresaId, dto, user.usuario);
  }

  // ===== Pedidos Detalle =====

  @Get('pedidos-det')
  @ApiOperation({ summary: 'Listar detalle de pedidos' })
  @ApiResponse({ status: 200, description: 'Lista de detalle de pedidos obtenida exitosamente' })
  findAllPedidoDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPedidoDet(empresaId);
  }

  @Get('pedidos-det/:id')
  @ApiOperation({ summary: 'Obtener detalle de pedido por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de pedido encontrado' })
  @ApiResponse({ status: 404, description: 'Detalle de pedido no encontrado' })
  findPedidoDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPedidoDet(id, empresaId);
  }

  @Post('pedidos-det')
  @ApiOperation({ summary: 'Crear detalle de pedido' })
  @ApiResponse({ status: 201, description: 'Detalle de pedido creado exitosamente' })
  createPedidoDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPedidoDet(dto, user.usuario);
  }

  @Put('pedidos-det/:id')
  @ApiOperation({ summary: 'Actualizar detalle de pedido' })
  @ApiResponse({ status: 200, description: 'Detalle de pedido actualizado exitosamente' })
  updatePedidoDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePedidoDet(id, empresaId, dto, user.usuario);
  }

  @Get('pedidos-det/pedido/:pedidoId')
  @ApiOperation({ summary: 'Obtener detalles de pedido por maestro' })
  @ApiResponse({ status: 200, description: 'Detalles encontrados' })
  findPedidoDetByPedidoId(
    @Param('pedidoId', ParseIntPipe) pedidoId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPedidoDetByPedidoId(pedidoId, empresaId);
  }

  @Delete('pedidos/:id')
  @ApiOperation({ summary: 'Eliminar pedido y sus detalles' })
  @ApiResponse({ status: 200, description: 'Pedido eliminado' })
  deletePedido(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.deletePedido(id, empresaId);
  }

  @Delete('pedidos-det/:id')
  @ApiOperation({ summary: 'Eliminar detalle de pedido' })
  @ApiResponse({ status: 200, description: 'Detalle eliminado' })
  deletePedidoDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.deletePedidoDet(id, empresaId);
  }

  // ===== Combos =====

  @Get('combos')
  @ApiOperation({ summary: 'Listar combos' })
  @ApiResponse({ status: 200, description: 'Lista de combos obtenida exitosamente' })
  findAllCombos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllComboMae(empresaId);
  }

  @Get('combos/:id')
  @ApiOperation({ summary: 'Obtener combo por ID' })
  @ApiResponse({ status: 200, description: 'Combo encontrado' })
  @ApiResponse({ status: 404, description: 'Combo no encontrado' })
  findCombo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findComboMae(id, empresaId);
  }

  @Post('combos')
  @ApiOperation({ summary: 'Crear combo' })
  @ApiResponse({ status: 201, description: 'Combo creado exitosamente' })
  createCombo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createComboMae(dto, user.usuario);
  }

  @Put('combos/:id')
  @ApiOperation({ summary: 'Actualizar combo' })
  @ApiResponse({ status: 200, description: 'Combo actualizado exitosamente' })
  updateCombo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateComboMae(id, empresaId, dto, user.usuario);
  }

  // ===== Combos Detalle =====

  @Get('combos-det')
  @ApiOperation({ summary: 'Listar detalle de combos' })
  @ApiResponse({ status: 200, description: 'Lista de detalle de combos obtenida exitosamente' })
  findAllComboDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllComboDet(empresaId);
  }

  @Get('combos-det/mae/:maeId')
  @ApiOperation({ summary: 'Obtener detalles de combo por maestro' })
  findComboDetByMae(
    @Param('maeId', ParseIntPipe) maeId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findComboDetByMae(maeId, empresaId);
  }

  @Get('combos-det/:id')
  @ApiOperation({ summary: 'Obtener detalle de combo por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de combo encontrado' })
  @ApiResponse({ status: 404, description: 'Detalle de combo no encontrado' })
  findComboDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findComboDet(id, empresaId);
  }

  @Post('combos-det')
  @ApiOperation({ summary: 'Crear detalle de combo' })
  @ApiResponse({ status: 201, description: 'Detalle de combo creado exitosamente' })
  createComboDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createComboDet(dto, user.usuario);
  }

  @Put('combos-det/:id')
  @ApiOperation({ summary: 'Actualizar detalle de combo' })
  @ApiResponse({ status: 200, description: 'Detalle de combo actualizado exitosamente' })
  updateComboDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateComboDet(id, empresaId, dto, user.usuario);
  }

  @Delete('combos-det/:id')
  @ApiOperation({ summary: 'Eliminar detalle de combo' })
  @ApiResponse({ status: 200, description: 'Detalle de combo eliminado exitosamente' })
  removeComboDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeComboDet(id, empresaId);
  }

  @Delete('combos/:id')
  @ApiOperation({ summary: 'Eliminar combo' })
  @ApiResponse({ status: 200, description: 'Combo eliminado exitosamente' })
  removeCombo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCombo(id, empresaId);
  }

  // ===== Precios =====

  @Get('precios')
  @ApiOperation({ summary: 'Listar precios' })
  @ApiResponse({ status: 200, description: 'Lista de precios obtenida exitosamente' })
  findAllPrecios(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPrecios(empresaId);
  }

  @Get('precios/:id')
  @ApiOperation({ summary: 'Obtener precio por ID' })
  @ApiResponse({ status: 200, description: 'Precio encontrado' })
  @ApiResponse({ status: 404, description: 'Precio no encontrado' })
  findPrecio(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPrecio(id, empresaId);
  }

  @Post('precios')
  @ApiOperation({ summary: 'Crear precio' })
  @ApiResponse({ status: 201, description: 'Precio creado exitosamente' })
  createPrecio(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPrecio(dto, user.usuario);
  }

  @Put('precios/:id')
  @ApiOperation({ summary: 'Actualizar precio' })
  @ApiResponse({ status: 200, description: 'Precio actualizado exitosamente' })
  updatePrecio(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePrecio(id, empresaId, dto, user.usuario);
  }

  // ===== Descuentos =====

  @Get('descuentos')
  @ApiOperation({ summary: 'Listar descuentos' })
  @ApiResponse({ status: 200, description: 'Lista de descuentos obtenida exitosamente' })
  findAllDescuentos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDescuentos(empresaId);
  }

  @Get('descuentos/:id')
  @ApiOperation({ summary: 'Obtener descuento por ID' })
  @ApiResponse({ status: 200, description: 'Descuento encontrado' })
  @ApiResponse({ status: 404, description: 'Descuento no encontrado' })
  findDescuento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDescuento(id, empresaId);
  }

  @Post('descuentos')
  @ApiOperation({ summary: 'Crear descuento' })
  @ApiResponse({ status: 201, description: 'Descuento creado exitosamente' })
  createDescuento(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDescuento(dto, user.usuario);
  }

  @Put('descuentos/:id')
  @ApiOperation({ summary: 'Actualizar descuento' })
  @ApiResponse({ status: 200, description: 'Descuento actualizado exitosamente' })
  updateDescuento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDescuento(id, empresaId, dto, user.usuario);
  }

  // ===== FacCaja (formas de pago por factura) =====

  @Get('fac-caja')
  @ApiOperation({ summary: 'Listar formas de pago de facturas' })
  @ApiResponse({ status: 200, description: 'Lista obtenida exitosamente' })
  findAllFacCaja(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFacCaja(empresaId);
  }

  @Get('fac-caja/:id')
  @ApiOperation({ summary: 'Obtener forma de pago por ID' })
  @ApiResponse({ status: 200, description: 'Forma de pago encontrada' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  findFacCaja(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacCaja(id, empresaId);
  }

  @Get('fac-caja/factura/:facturaId')
  @ApiOperation({ summary: 'Obtener formas de pago por factura' })
  @ApiResponse({ status: 200, description: 'Formas de pago de la factura' })
  findFacCajaByFactura(
    @Param('facturaId', ParseIntPipe) facturaId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacCajaByFactura(facturaId, empresaId);
  }

  @Post('fac-caja')
  @ApiOperation({ summary: 'Crear forma de pago' })
  @ApiResponse({ status: 201, description: 'Forma de pago creada exitosamente' })
  createFacCaja(@Body() dto: CreatePosFacCajaDto, @CurrentUser() user: any) {
    return this.service.createFacCaja(dto, user.usuario);
  }

  @Put('fac-caja/:id')
  @ApiOperation({ summary: 'Actualizar forma de pago' })
  @ApiResponse({ status: 200, description: 'Forma de pago actualizada exitosamente' })
  updateFacCaja(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePosFacCajaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFacCaja(id, empresaId, dto, user.usuario);
  }

  @Delete('fac-caja/:id')
  @ApiOperation({ summary: 'Eliminar forma de pago' })
  @ApiResponse({ status: 200, description: 'Forma de pago eliminada' })
  removeFacCaja(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeFacCaja(id, empresaId);
  }

  // ===== Tienda Virtual =====

  @Post('tienda/checkout')
  @ApiOperation({ summary: 'Checkout de tienda virtual — convierte carrito en factura' })
  @ApiResponse({ status: 201, description: 'Factura creada exitosamente' })
  checkoutTienda(@Body() dto: CheckoutTiendaDto, @CurrentUser() user: any) {
    return this.service.checkoutTienda(dto, user.usuario);
  }

  @Post('pedidos/checkout')
  @ApiOperation({ summary: 'Checkout de pedido — convierte pedido en factura' })
  @ApiResponse({ status: 201, description: 'Factura creada exitosamente' })
  checkoutPedido(@Body() dto: CheckoutPedidoDto, @CurrentUser() user: any) {
    return this.service.checkoutPedido(dto, user.usuario);
  }

  @Get('cotizaciones-det/mae/:maeId')
  @ApiOperation({ summary: 'Obtener detalles de cotizaciÃ³n por maestro' })
  @ApiResponse({ status: 200, description: 'Detalles encontrados' })
  findCotizacionDetByMaeId(
    @Param('maeId', ParseIntPipe) maeId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCotizacionDetByMaeId(maeId, empresaId);
  }

  @Delete('cotizaciones/:id')
  @ApiOperation({ summary: 'Eliminar cotizaciÃ³n (carrito) y sus detalles' })
  @ApiResponse({ status: 200, description: 'CotizaciÃ³n eliminada' })
  deleteCotizacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.deleteCotizacion(id, empresaId);
  }

  @Delete('cotizaciones-det/:id')
  @ApiOperation({ summary: 'Eliminar detalle de cotizaciÃ³n' })
  @ApiResponse({ status: 200, description: 'Detalle eliminado' })
  deleteCotizacionDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.deleteCotizacionDet(id, empresaId);
  }

  @Post('cotizaciones/:id/enviar-correo')
  @ApiOperation({ summary: 'Enviar cotización por correo electrónico' })
  @ApiResponse({ status: 200, description: 'Correo enviado exitosamente' })
  @ApiResponse({ status: 400, description: 'Error en la solicitud' })
  async enviarCotizacionPorCorreo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body('email') email: string,
  ) {
    return this.service.enviarCotizacionPorCorreo(id, empresaId, email);
  }

  @Post('facturas/:id/enviar-correo')
  @ApiOperation({ summary: 'Enviar factura por correo electronico' })
  @ApiResponse({ status: 200, description: 'Correo enviado exitosamente' })
  @ApiResponse({ status: 400, description: 'Error en la solicitud' })
  async enviarFacturaPorCorreo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body('email') email: string,
  ) {
    return this.service.enviarFacturaPorCorreo(id, empresaId, email);
  }
}


