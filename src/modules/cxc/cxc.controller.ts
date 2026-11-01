import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CxcService } from './cxc.service';
import {
  CreateCxcClienteDto, UpdateCxcClienteDto,
  CreateCxcMovimientoDto, UpdateCxcMovimientoDto,
  CreateCxcPrestamoDto, UpdateCxcPrestamoDto,
} from './dto/cxc.dto';
import { CreateCxcCarteraCtaDto, UpdateCxcCarteraCtaDto } from './dto/carteracta.dto';
import { CreateCxcClientesInfoDto, UpdateCxcClientesInfoDto } from './dto/clientesinfo.dto';
import { CreateCxcCategoriaDto, UpdateCxcCategoriaDto } from './dto/cxccategoria.dto';
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
    @Query('q') q?: string,
    @Query('moduloId') moduloId?: string,
  ) {
    return this.service.findAllClientes(
      empresaId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      q,
      moduloId ? Number(moduloId) : undefined,
    );
  }

  @Get('clientes/dni-existe')
  @ApiOperation({ summary: 'Verificar si el DNI ya existe en clientes de la empresa (llave maestra)' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  verificarDniCliente(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('dni') dni: string,
    @Query('excluirId') excluirId?: string,
  ) {
    return this.service.verificarDniCliente(empresaId, dni, excluirId ? Number(excluirId) : undefined);
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

  // IMPORTANTE: estas rutas fijas deben ir ANTES de caja-mae/:id
  // para que NestJS no las matchee como :id y falle ParseIntPipe.
  @Get('caja-mae/rendicion')
  @ApiOperation({ summary: 'Rendición de caja: totales por forma de pago de una fecha' })
  @ApiResponse({ status: 200, description: 'Rendición obtenida' })
  findRendicionCaja(
    @Query('fecha') fecha: string,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findRendicionCaja(fecha, empresaId);
  }

  @Get('caja-mae/:id/recibo')
  @ApiOperation({ summary: 'Obtener datos del recibo de caja para impresión' })
  @ApiResponse({ status: 200, description: 'Datos del recibo' })
  findCajaRecibo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCajaRecibo(id, empresaId);
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

  @Post('caja-mae/:id/procesar-abono')
  @ApiOperation({ summary: 'Genera los movimientos CxC de un cobro (reparto cargos vs capital) o aplica a un préstamo (interés simple)' })
  @ApiResponse({ status: 201, description: 'Movimientos generados o abono a préstamo aplicado' })
  procesarAbonoCaja(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() body?: {
      interes?: number;
      mora?: number;
      prestamoId?: number;
    },
  ) {
    return this.service.procesarAbonoCaja(id, user.empresaId, user.usuario, body ?? {});
  }

  @Post('caja-mae/:id/anular')
  @ApiOperation({ summary: 'Anular una caja (cobro) completa con reversa de movimientos' })
  @ApiResponse({ status: 201, description: 'Caja anulada' })
  anularCaja(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.service.anularCaja(id, user.empresaId, user.usuario);
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
    dto.Idsucursal = user.idsucursal;
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

  @Put('movimientos/:id/anular')
  @ApiOperation({ summary: 'Anular un movimiento CxC (solo manuales no contabilizados)' })
  @ApiResponse({ status: 200, description: 'Movimiento anulado' })
  @ApiResponse({ status: 400, description: 'Automatico o contabilizado: no anulable aqui' })
  @ApiResponse({ status: 409, description: 'Ya anulado' })
  anularMovimiento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.anularMovimiento(id, empresaId, user.usuario);
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
	@Query('documentoId') documentoId?: string,
  ) {
    const id = Number(empresaId);
    return this.service.findHistoricoConFiltros(id, dni, cliente, fechaDesde, fechaHasta, documentoId);
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

  @Put('prestamos/:id/preaprobado')
  @ApiOperation({ summary: 'Pre-aprobar préstamo (guarda con prestamoId, NO genera nroprestamo)' })
  preaprobarPrestamo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.preaprobarPrestamo(id, empresaId, user.usuario);
  }

  @Put('prestamos/:id/aprobar')
  @ApiOperation({ summary: 'Aprobar préstamo (solo pre-aprobados)' })
  aprobarPrestamo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.aprobarPrestamo(id, empresaId, user.usuario);
  }

  @Put('prestamos/:id/contabilizar')
  @ApiOperation({ summary: 'Contabilizar préstamo (partida D préstamo / C bancos + movimiento D capital neto)' })
  contabilizarPrestamo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.contabilizarPrestamo(id, empresaId, user.usuario);
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

  @Delete('prestamo-pp/prestamo/:prestamoId')
  @ApiOperation({ summary: 'Eliminar todas las cuotas del plan de un préstamo (regenerar plan)' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  deletePrestamoPPByPrestamo(
    @Param('prestamoId', ParseIntPipe) prestamoId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.deletePrestamoPPByPrestamo(prestamoId, empresaId);
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

  @Get('antiguedad-saldos-prestamos')
  @ApiOperation({ summary: 'Antigüedad de saldos por préstamos (cuotas PP)' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  getAntiguedadSaldosPrestamos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.getAntiguedadSaldosPrestamos(empresaId);
  }

  @Get('antiguedad-saldos-prestamos-cuotas')
  @ApiOperation({ summary: 'Antigüedad de saldos por préstamos basada en cuotas (cxcprestamospp)' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  getAntiguedadSaldosPrestamosCuotas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.getAntiguedadSaldosPrestamosCuotas(empresaId);
  }

  @Get('clientes-con-saldo')
  @ApiOperation({ summary: 'Clientes con saldo pendiente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  getClientesConSaldo(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.getClientesConSaldo(empresaId);
  }

  @Get('clientes-con-prestamos')
  @ApiOperation({ summary: 'Clientes con préstamos activos (caja destino=Préstamos)' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  getClientesConPrestamos(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('moduloId') moduloId?: string,
  ) {
    return this.service.getClientesConPrestamos(
      empresaId,
      moduloId ? Number(moduloId) : undefined,
    );
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

  // ========== Cartera Contable por Cliente (cxccarteracta) ==========

  @Get('carteras-cliente')
  @ApiOperation({ summary: 'Listar carteras contables por cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllCarterasCta(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCarterasCta(empresaId);
  }

  @Get('carteras-cliente/:id')
  @ApiOperation({ summary: 'Obtener cartera contable de cliente por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  findCarteraCta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCarteraCta(id, empresaId);
  }

  @Post('carteras-cliente')
  @ApiOperation({ summary: 'Asignar cartera contable a cliente' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Cliente/cartera inválido o asignación duplicada' })
  createCarteraCta(@Body() dto: CreateCxcCarteraCtaDto, @CurrentUser() user: any) {
    return this.service.createCarteraCta(dto, user.usuario, user.idsucursal);
  }

  @Put('carteras-cliente/:id')
  @ApiOperation({ summary: 'Actualizar cartera contable de cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  updateCarteraCta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCxcCarteraCtaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCarteraCta(id, empresaId, dto, user.usuario, user.idsucursal);
  }

  @Put('carteras-cliente/:id/remove')
  @ApiOperation({ summary: 'Eliminar cartera contable de cliente (físico)' })
  @ApiResponse({ status: 200, description: 'Eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  removeCarteraCta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCarteraCta(id, empresaId);
  }

  // ========== Info de Clientes (cxccclientesinfo) ==========

  @Get('clientes-info')
  @ApiOperation({ summary: 'Listar información de clientes (celular/dirección/correo)' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllClientesInfo(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllClientesInfo(empresaId);
  }

  @Get('clientes-info/cliente/:clienteId')
  @ApiOperation({ summary: 'Información por cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findClientesInfoByCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findClientesInfoByCliente(clienteId, empresaId);
  }

  @Get('clientes-info/:id')
  @ApiOperation({ summary: 'Obtener información de cliente por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  findClienteInfo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findClienteInfo(id, empresaId);
  }

  @Post('clientes-info')
  @ApiOperation({ summary: 'Crear información de cliente' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Cliente inválido o tipo duplicado' })
  createClienteInfo(@Body() dto: CreateCxcClientesInfoDto, @CurrentUser() user: any) {
    return this.service.createClienteInfo(dto, user.usuario);
  }

  @Put('clientes-info/:id')
  @ApiOperation({ summary: 'Actualizar información de cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  @ApiResponse({ status: 400, description: 'Cliente inválido o tipo duplicado' })
  updateClienteInfo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCxcClientesInfoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateClienteInfo(id, empresaId, dto, user.usuario);
  }

  @Put('clientes-info/:id/remove')
  @ApiOperation({ summary: 'Desactivar información de cliente (sn_activo = N)' })
  @ApiResponse({ status: 200, description: 'Desactivado exitosamente' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  removeClienteInfo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.removeClienteInfo(id, empresaId, user.usuario);
  }

  // ========== Categorías de Clientes (cxccategorias) ==========
  @Get('categorias')
  @ApiOperation({ summary: 'Listar categorías de clientes' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllCategorias(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCategorias(empresaId);
  }

  @Get('categorias/:id')
  @ApiOperation({ summary: 'Obtener categoría de cliente por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  findCategoria(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCategoria(id, empresaId);
  }

  @Post('categorias')
  @ApiOperation({ summary: 'Crear categoría de cliente' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createCategoria(@Body() dto: CreateCxcCategoriaDto, @CurrentUser() user: any) {
    return this.service.createCategoria(dto, user.usuario);
  }

  @Put('categorias/:id')
  @ApiOperation({ summary: 'Actualizar categoría de cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  updateCategoria(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCxcCategoriaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCategoria(id, empresaId, dto, user.usuario);
  }

  @Delete('categorias/:id')
  @ApiOperation({ summary: 'Eliminar categoría de cliente' })
  @ApiResponse({ status: 200, description: 'Eliminado exitosamente' })
  removeCategoria(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCategoria(id, empresaId);
  }
}
