import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CxcService } from './cxc.service';
import {
  CreateCxcClienteDto, UpdateCxcClienteDto,
  CreateCxcMovimientoDto, UpdateCxcMovimientoDto,
  CreateCxcPrestamoDto, UpdateCxcPrestamoDto,
} from './dto/cxc.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('CxC')
@ApiBearerAuth()
@Controller('cxc')
@UseGuards(JwtAuthGuard)
export class CxcController {
  constructor(private readonly service: CxcService) {}

  @Get('clientes')
  @ApiOperation({ summary: 'Listar clientes con paginación' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllClientes(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string
  ) {
    return this.service.findAllClientes(empresaId, page ? Number(page) : 1, limit ? Number(limit) : 10, q);
  }

  @Get('clientes/:id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findCliente(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCliente(id, empresaId);
  }

  @Post('clientes')
  @ApiOperation({ summary: 'Crear cliente' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createCliente(@Body() dto: CreateCxcClienteDto, @CurrentUser() user: any) {
    return this.service.createCliente(dto, user.usuario);
  }

  @Put('clientes/:id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  updateCliente(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCxcClienteDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCliente(id, empresaId, dto, user.usuario);
  }

  @Get('clientes-dir')
  @ApiOperation({ summary: 'Listar direcciones de clientes' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllClientesDir(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllClientesDir(empresaId);
  }

  @Get('clientes-dir/:id')
  @ApiOperation({ summary: 'Obtener dirección de cliente por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findClienteDir(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findClienteDir(id, empresaId);
  }

  @Post('clientes-dir')
  @ApiOperation({ summary: 'Crear dirección de cliente' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createClienteDir(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createClienteDir(dto, user.usuario);
  }

  @Put('clientes-dir/:id')
  @ApiOperation({ summary: 'Actualizar dirección de cliente' })
  updateClienteDir(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateClienteDir(id, empresaId, dto, user.usuario);
  }

  @Get('clientes-tel')
  @ApiOperation({ summary: 'Listar teléfonos de clientes' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllClientesTel(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllClientesTel(empresaId);
  }

  @Get('clientes-tel/:id')
  @ApiOperation({ summary: 'Obtener teléfono de cliente por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findClienteTel(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findClienteTel(id, empresaId);
  }

  @Post('clientes-tel')
  @ApiOperation({ summary: 'Crear teléfono de cliente' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createClienteTel(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createClienteTel(dto, user.usuario);
  }

  @Put('clientes-tel/:id')
  @ApiOperation({ summary: 'Actualizar teléfono de cliente' })
  updateClienteTel(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateClienteTel(id, empresaId, dto, user.usuario);
  }

  @Get('clientes-ref')
  @ApiOperation({ summary: 'Listar referencias de clientes' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllClientesRef(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllClientesRef(empresaId);
  }

  @Get('clientes-ref/cliente/:clienteId')
  @ApiOperation({ summary: 'Referencias por cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findClientesRefByCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findClientesRefByCliente(clienteId, empresaId);
  }

  @Get('clientes-ref/:id')
  @ApiOperation({ summary: 'Obtener referencia de cliente por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findClienteRef(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findClienteRef(id, empresaId);
  }

  @Post('clientes-ref')
  @ApiOperation({ summary: 'Crear referencia de cliente' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createClienteRef(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createClienteRef(dto, user.usuario);
  }

  @Put('clientes-ref/:id')
  @ApiOperation({ summary: 'Actualizar referencia de cliente' })
  updateClienteRef(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateClienteRef(id, empresaId, dto, user.usuario);
  }

  @Get('cajeros')
  @ApiOperation({ summary: 'Listar cajeros' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllCajeros(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCajeros(empresaId);
  }

  @Get('cajeros/:id')
  @ApiOperation({ summary: 'Obtener cajero por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findCajero(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCajero(id, empresaId);
  }

  @Post('cajeros')
  @ApiOperation({ summary: 'Crear cajero' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createCajero(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCajero(dto, user.usuario);
  }

  @Put('cajeros/:id')
  @ApiOperation({ summary: 'Actualizar cajero' })
  updateCajero(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCajero(id, empresaId, dto, user.usuario);
  }

  @Get('caja-mae')
  @ApiOperation({ summary: 'Listar cabeceras de caja' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllCajaMae(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCajaMae(empresaId);
  }

  @Get('caja-mae/:id')
  @ApiOperation({ summary: 'Obtener cabecera de caja por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findCajaMae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCajaMae(id, empresaId);
  }

  @Post('caja-mae')
  @ApiOperation({ summary: 'Crear cabecera de caja' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createCajaMae(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCajaMae(dto, user.usuario);
  }

  @Put('caja-mae/:id')
  @ApiOperation({ summary: 'Actualizar cabecera de caja' })
  updateCajaMae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCajaMae(id, empresaId, dto, user.usuario);
  }

  @Get('caja-det')
  @ApiOperation({ summary: 'Listar detalles de caja' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllCajaDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCajaDet(empresaId);
  }

  @Get('caja-det/:id')
  @ApiOperation({ summary: 'Obtener detalle de caja por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findCajaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCajaDet(id, empresaId);
  }

  @Post('caja-det')
  @ApiOperation({ summary: 'Crear detalle de caja' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createCajaDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCajaDet(dto, user.usuario);
  }

  @Put('caja-det/:id')
  @ApiOperation({ summary: 'Actualizar detalle de caja' })
  updateCajaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCajaDet(id, empresaId, dto, user.usuario);
  }

  @Get('movimientos')
  @ApiOperation({ summary: 'Listar movimientos CxC' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllMovimientos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMovimientos(empresaId);
  }

  @Get('movimientos/cliente/:clienteId')
  @ApiOperation({ summary: 'Movimientos por cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findMovimientosByCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMovimientosByCliente(clienteId, empresaId);
  }

  @Get('movimientos/:id')
  @ApiOperation({ summary: 'Obtener movimiento por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findMovimiento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMovimiento(id, empresaId);
  }

  @Post('movimientos')
  @ApiOperation({ summary: 'Crear movimiento' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createMovimiento(@Body() dto: CreateCxcMovimientoDto, @CurrentUser() user: any) {
    return this.service.createMovimiento(dto, user.usuario);
  }

  @Put('movimientos/:id')
  @ApiOperation({ summary: 'Actualizar movimiento' })
  updateMovimiento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCxcMovimientoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMovimiento(id, empresaId, dto, user.usuario);
  }

  @Get('historico')
  @ApiOperation({ summary: 'Listar histórico' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllHistoro(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllHistoro(empresaId);
  }

  @Get('historico/filtros')
  @ApiOperation({ summary: 'Histórico con filtros (dni, cliente, fecha)' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findHistoricoConFiltros(
    @Query('empresaId') empresaId: number,
    @Query('dni') dni?: string,
    @Query('cliente') cliente?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    const id = Number(empresaId);
    return this.service.findHistoricoConFiltros(id, dni, cliente, fechaDesde, fechaHasta);
  }

  @Get('historico/cliente/:clienteId')
  @ApiOperation({ summary: 'Histórico por cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findHistoricoByCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findHistoricoByCliente(clienteId, empresaId);
  }

  @Get('historico/:id')
  @ApiOperation({ summary: 'Obtener registro histórico por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findHistoro(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findHistoro(id, empresaId);
  }

  @Post('historico')
  @ApiOperation({ summary: 'Crear registro histórico' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createHistoro(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createHistoro(dto, user.usuario);
  }

  @Put('historico/:id')
  @ApiOperation({ summary: 'Actualizar registro histórico' })
  updateHistoro(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateHistoro(id, empresaId, dto, user.usuario);
  }

  @Get('saldo-favor')
  @ApiOperation({ summary: 'Listar saldos a favor' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllSalFav(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllSalFav(empresaId);
  }

  @Get('saldo-favor/:id')
  @ApiOperation({ summary: 'Obtener saldo a favor por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findSalFav(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findSalFav(id, empresaId);
  }

  @Post('saldo-favor')
  @ApiOperation({ summary: 'Crear saldo a favor' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createSalFav(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createSalFav(dto, user.usuario);
  }

  @Put('saldo-favor/:id')
  @ApiOperation({ summary: 'Actualizar saldo a favor' })
  updateSalFav(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateSalFav(id, empresaId, dto, user.usuario);
  }

  @Get('dias-cobro')
  @ApiOperation({ summary: 'Listar días de cobro' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllDiasCobro(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDiasCobro(empresaId);
  }

  @Get('dias-cobro/:id')
  @ApiOperation({ summary: 'Obtener día de cobro por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findDiasCobro(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDiasCobro(id, empresaId);
  }

  @Post('dias-cobro')
  @ApiOperation({ summary: 'Crear día de cobro' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createDiasCobro(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDiasCobro(dto, user.usuario);
  }

  @Put('dias-cobro/:id')
  @ApiOperation({ summary: 'Actualizar día de cobro' })
  updateDiasCobro(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDiasCobro(id, empresaId, dto, user.usuario);
  }

  @Get('prestamos')
  @ApiOperation({ summary: 'Listar préstamos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllPrestamos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPrestamos(empresaId);
  }

  @Get('prestamos/cliente/:clienteId')
  @ApiOperation({ summary: 'Préstamos por cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findPrestamosByCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPrestamosByCliente(clienteId, empresaId);
  }

  @Get('prestamos/:id')
  @ApiOperation({ summary: 'Obtener préstamo por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findPrestamo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPrestamo(id, empresaId);
  }

  @Post('prestamos')
  @ApiOperation({ summary: 'Crear préstamo' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createPrestamo(@Body() dto: CreateCxcPrestamoDto, @CurrentUser() user: any) {
    return this.service.createPrestamo(dto, user.usuario);
  }

  @Put('prestamos/:id')
  @ApiOperation({ summary: 'Actualizar préstamo' })
  updatePrestamo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCxcPrestamoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePrestamo(id, empresaId, dto, user.usuario);
  }

  @Get('prestamo-pp')
  @ApiOperation({ summary: 'Listar plan de pagos de préstamos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllPrestamoPP(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('prestamoId') prestamoId?: string,
  ) {
    return this.service.findAllPrestamoPP(empresaId, prestamoId ? Number(prestamoId) : undefined);
  }

  @Get('prestamo-pp/:id')
  @ApiOperation({ summary: 'Obtener cuota de plan de pagos por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findPrestamoPP(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPrestamoPP(id, empresaId);
  }

  @Post('prestamo-pp')
  @ApiOperation({ summary: 'Crear cuota de plan de pagos' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createPrestamoPP(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPrestamoPP(dto, user.usuario);
  }

  @Put('prestamo-pp/:id')
  @ApiOperation({ summary: 'Actualizar cuota de plan de pagos' })
  updatePrestamoPP(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePrestamoPP(id, empresaId, dto, user.usuario);
  }

  @Get('parientes')
  @ApiOperation({ summary: 'Listar parientes' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllParientes(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllParientes(empresaId);
  }

  @Get('parientes/cliente/:clienteId')
  @ApiOperation({ summary: 'Parientes por cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParientesByCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findParientesByCliente(clienteId, empresaId);
  }

  @Get('parientes/:id')
  @ApiOperation({ summary: 'Obtener pariente por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findPariente(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPariente(id, empresaId);
  }

  @Post('parientes')
  @ApiOperation({ summary: 'Crear pariente' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createPariente(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPariente(dto, user.usuario);
  }

  @Put('parientes/:id')
  @ApiOperation({ summary: 'Actualizar pariente' })
  updatePariente(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePariente(id, empresaId, dto, user.usuario);
  }

  @Get('antiguedad-saldos')
  @ApiOperation({ summary: 'Antigüedad de saldos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  getAntiguedadSaldos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.getAntiguedadSaldos(empresaId);
  }

  @Get('clientes-con-saldo')
  @ApiOperation({ summary: 'Clientes con saldo pendiente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  getClientesConSaldo(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.getClientesConSaldo(empresaId);
  }

  @Get('documentos-pendientes/cliente/:clienteId')
  @ApiOperation({ summary: 'Documentos pendientes por cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findDocumentosPendientesCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDocumentosPendientesCliente(clienteId, empresaId);
  }
}
