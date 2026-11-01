import {
  Controller, Get, Post, Delete, Put, Body, Param, Query,
  UseGuards, ParseIntPipe, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BancosService } from './bancos.service';
import { CreateBancoDto, UpdateBancoDto, CreateBcoCtaDto, UpdateBcoCtaDto, CreateBcoMovimientoDto, UpdateBcoMovimientoDto, EmitirChequeDto, EmitirChequeParticularDto, CreateConciliacionDto, CreateBcoCcdocsDto, UpdateBcoCcdocsDto } from './dto/banco.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Bancos')
@ApiBearerAuth()
@Controller('bancos')
@UseGuards(JwtAuthGuard)
export class BancosController {
  constructor(private readonly service: BancosService) {}

  @Get('bancos')
  @ApiOperation({ summary: 'Listar bancos' })
  @ApiResponse({ status: 200, description: 'Lista de bancos obtenida exitosamente' })
  findAllBancos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllBancos(empresaId);
  }

  @Get('bancos/:id')
  @ApiOperation({ summary: 'Obtener banco por ID' })
  @ApiResponse({ status: 200, description: 'Banco encontrado' })
  @ApiResponse({ status: 404, description: 'Banco no encontrado' })
  findBanco(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findBanco(id, empresaId);
  }

  @Post('bancos')
  @ApiOperation({ summary: 'Crear banco' })
  @ApiResponse({ status: 201, description: 'Banco creado exitosamente' })
  createBanco(@Body() dto: CreateBancoDto, @CurrentUser() user: any) {
    return this.service.createBanco(dto, user.usuario);
  }

  @Put('bancos/:id')
  @ApiOperation({ summary: 'Actualizar banco' })
  @ApiResponse({ status: 200, description: 'Banco actualizado exitosamente' })
  updateBanco(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateBancoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateBanco(id, empresaId, dto, user.usuario);
  }

  @Get('cuentas')
  @ApiOperation({ summary: 'Listar cuentas bancarias' })
  @ApiResponse({ status: 200, description: 'Lista de cuentas bancarias obtenida exitosamente' })
  findAllCtas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCtas(empresaId);
  }

  @Get('cuentas/:id')
  @ApiOperation({ summary: 'Obtener cuenta bancaria por ID' })
  @ApiResponse({ status: 200, description: 'Cuenta bancaria encontrada' })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada' })
  findCta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCta(id, empresaId);
  }

  @Post('cuentas')
  @ApiOperation({ summary: 'Crear cuenta bancaria' })
  @ApiResponse({ status: 201, description: 'Cuenta bancaria creada exitosamente' })
  createCta(@Body() dto: CreateBcoCtaDto, @CurrentUser() user: any) {
    return this.service.createCta(dto, user.usuario);
  }

  @Put('cuentas/:id')
  @ApiOperation({ summary: 'Actualizar cuenta bancaria' })
  @ApiResponse({ status: 200, description: 'Cuenta bancaria actualizada exitosamente' })
  updateCta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateBcoCtaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCta(id, empresaId, dto, user.usuario);
  }

  @Get('conciliaciones')
  @ApiOperation({ summary: 'Listar conciliaciones bancarias' })
  @ApiResponse({ status: 200, description: 'Lista de conciliaciones bancarias obtenida exitosamente' })
  findAllConciliaciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllConciliaciones(empresaId);
  }

  @Get('conciliaciones/:id')
  @ApiOperation({ summary: 'Obtener conciliación bancaria por ID' })
  @ApiResponse({ status: 200, description: 'Conciliación bancaria encontrada' })
  @ApiResponse({ status: 404, description: 'Conciliación bancaria no encontrada' })
  findConciliacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findConciliacion(id, empresaId);
  }

  @Get('direcciones')
  @ApiOperation({ summary: 'Listar direcciones de bancos' })
  @ApiResponse({ status: 200, description: 'Lista de direcciones de bancos obtenida exitosamente' })
  findAllDirecciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDirecciones(empresaId);
  }

  @Post('direcciones')
  @ApiOperation({ summary: 'Crear dirección de banco' })
  @ApiResponse({ status: 201, description: 'Dirección creada exitosamente' })
  createDireccion(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDireccion(dto, user.usuario);
  }

  @Put('direcciones/:id')
  @ApiOperation({ summary: 'Actualizar dirección de banco' })
  @ApiResponse({ status: 200, description: 'Dirección actualizada exitosamente' })
  updateDireccion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDireccion(id, empresaId, dto, user.usuario);
  }

  @Get('telefonos')
  @ApiOperation({ summary: 'Listar teléfonos de bancos' })
  @ApiResponse({ status: 200, description: 'Lista de teléfonos de bancos obtenida exitosamente' })
  findAllTelefonos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTelefonos(empresaId);
  }

  @Post('telefonos')
  @ApiOperation({ summary: 'Crear teléfono de banco' })
  @ApiResponse({ status: 201, description: 'Teléfono creado exitosamente' })
  createTelefono(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createTelefono(dto, user.usuario);
  }

  @Put('telefonos/:id')
  @ApiOperation({ summary: 'Actualizar teléfono de banco' })
  @ApiResponse({ status: 200, description: 'Teléfono actualizado exitosamente' })
  updateTelefono(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTelefono(id, empresaId, dto, user.usuario);
  }

  // ── Movimientos bancarios ──────────────────────────────────

  @Get('movimientos')
  @ApiOperation({ summary: 'Listar movimientos bancarios' })
  @ApiResponse({ status: 200, description: 'Lista de movimientos obtenida exitosamente' })
  findAllMovimientos(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('bcoctasId') bcoctasId?: string,
  ) {
    return this.service.findAllMovimientos(empresaId, bcoctasId ? Number(bcoctasId) : undefined);
  }

  @Get('cheques')
  @ApiOperation({ summary: 'Listar cheques emitidos' })
  @ApiResponse({ status: 200, description: 'Lista de cheques emitidos' })
  findCheques(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('bcoctasId') bcoctasId?: string,
  ) {
    return this.service.findCheques(empresaId, bcoctasId ? Number(bcoctasId) : undefined);
  }

  @Get('movimientos/:id')
  @ApiOperation({ summary: 'Obtener movimiento por ID' })
  @ApiResponse({ status: 200, description: 'Movimiento encontrado' })
  findMovimiento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMovimiento(id, empresaId);
  }

  @Post('movimientos')
  @ApiOperation({ summary: 'Crear movimiento bancario' })
  @ApiResponse({ status: 201, description: 'Movimiento creado exitosamente' })
  createMovimiento(@Body() dto: CreateBcoMovimientoDto, @CurrentUser() user: any) {
    return this.service.createMovimiento(dto, user.usuario);
  }

  @Put('movimientos/:id')
  @ApiOperation({ summary: 'Actualizar movimiento bancario' })
  @ApiResponse({ status: 200, description: 'Movimiento actualizado exitosamente' })
  updateMovimiento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateBcoMovimientoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMovimiento(id, empresaId, dto, user.usuario);
  }

  @Put('movimientos/:id/anular')
  @ApiOperation({ summary: 'Anular movimiento bancario (con lógica CxP si es cheque)' })
  @ApiResponse({ status: 200, description: 'Movimiento anulado exitosamente' })
  @ApiResponse({ status: 400, description: 'Error al anular' })
  anularMovimiento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.anularMovimiento(id, empresaId, user.usuario);
  }

  // ── Emisión de cheques ──────────────────────────────────

  @Post('cheques/emitir')
  @ApiOperation({ summary: 'Emitir cheques de pago a proveedores' })
  @ApiResponse({ status: 201, description: 'Cheques emitidos exitosamente' })
  @ApiResponse({ status: 400, description: 'Error al emitir cheques' })
  emitirCheques(@Body() dto: EmitirChequeDto, @CurrentUser() user: any) {
    return this.service.emitirCheques(dto, user.usuario);
  }

  @Post('cheques/emitir-particular')
  @ApiOperation({ summary: 'Emitir cheque a particular / empleado' })
  @ApiResponse({ status: 201, description: 'Cheque emitido exitosamente' })
  @ApiResponse({ status: 400, description: 'Error al emitir cheque' })
  emitirChequeParticular(@Body() dto: EmitirChequeParticularDto, @CurrentUser() user: any) {
    return this.service.emitirChequeParticular(dto, user.usuario);
  }

  // ── Conciliación Bancaria ──

  @Post('conciliaciones')
  @ApiOperation({ summary: 'Guardar conciliación bancaria (maestro + detalle)' })
  @ApiResponse({ status: 201, description: 'Conciliación guardada exitosamente' })
  createConciliacion(@Body() dto: CreateConciliacionDto, @CurrentUser() user: any) {
    return this.service.guardarConciliacion(dto, user.usuario || user.sub);
  }

  @Get('conciliaciones/:id/completa')
  @ApiOperation({ summary: 'Obtener conciliación con detalles enriquecidos' })
  @ApiResponse({ status: 200, description: 'Conciliación encontrada' })
  @ApiResponse({ status: 404, description: 'Conciliación no encontrada' })
  findConciliacionCompleta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findConciliacionCompleta(id, empresaId);
  }

  @Delete('conciliaciones/:id')
  @ApiOperation({ summary: 'Eliminar conciliación bancaria' })
  @ApiResponse({ status: 200, description: 'Conciliación eliminada' })
  deleteConciliacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.deleteConciliacion(id, empresaId, user.usuario || user.sub);
  }

  @Post('conciliaciones/parsear-csv')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Parsear CSV del estado de cuenta bancario' })
  @ApiResponse({ status: 200, description: 'CSV parseado exitosamente' })
  parsearCsv(@UploadedFile() file: any) {
    const content = file.buffer.toString('utf-8');
    return this.service.parsearCsvConciliacion(content);
  }

  @Post('conciliaciones/matching')
  @ApiOperation({ summary: 'Realizar matching entre CSV y movimientos bancarios' })
  @ApiResponse({ status: 200, description: 'Matching completado' })
  realizarMatching(
    @Body() body: { bcoctasId: number; empresaId: number; lineasCsv: any[] },
    @CurrentUser() user: any,
  ) {
    return this.service.realizarMatching(body.bcoctasId, body.empresaId, body.lineasCsv, user.usuario || user.sub);
  }

  // ── Documentos de conciliación (bcosccdocs) ────────────────

  @Get('ccdocs')
  @ApiOperation({ summary: 'Listar documentos de conciliación bancaria' })
  @ApiResponse({ status: 200, description: 'Lista de documentos obtenida exitosamente' })
  findAllCcdocs(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCcdocs(empresaId);
  }

  @Get('ccdocs/:id')
  @ApiOperation({ summary: 'Obtener documento de conciliación por ID' })
  @ApiResponse({ status: 200, description: 'Documento encontrado' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado' })
  findCcdoc(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCcdoc(id, empresaId);
  }

  @Post('ccdocs')
  @ApiOperation({ summary: 'Crear documento de conciliación' })
  @ApiResponse({ status: 201, description: 'Documento creado exitosamente' })
  createCcdoc(@Body() dto: CreateBcoCcdocsDto, @CurrentUser() user: any) {
    return this.service.createCcdoc(dto, user.usuario);
  }

  @Put('ccdocs/:id')
  @ApiOperation({ summary: 'Actualizar documento de conciliación' })
  @ApiResponse({ status: 200, description: 'Documento actualizado exitosamente' })
  updateCcdoc(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateBcoCcdocsDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCcdoc(id, empresaId, dto, user.usuario);
  }

  @Delete('ccdocs/:id')
  @ApiOperation({ summary: 'Desactivar documento de conciliación (soft delete: sn_activo=N)' })
  @ApiResponse({ status: 200, description: 'Documento desactivado' })
  removeCcdoc(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCcdoc(id, empresaId);
  }
}
