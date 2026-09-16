import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContabilidadService } from './contabilidad.service';
import {
  CreateTcoctacontablesDto, UpdateTcoctacontablesDto,
  CreateCopdamaeDto, UpdateCopdamaeDto,
  CreateCopdadetDto, UpdateCopdadetDto,
} from './dto/contabilidad.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Contabilidad')
@ApiBearerAuth()
@Controller('contabilidad')
@UseGuards(JwtAuthGuard)
export class ContabilidadController {
  constructor(private readonly service: ContabilidadService) {}

  // ===== Ctacontables =====

  @Get('ctacontables')
  @ApiOperation({ summary: 'Listar cuentas contables' })
  @ApiResponse({ status: 200, description: 'Lista de cuentas contables obtenida exitosamente' })
  findAllCtacontables(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCtacontables(empresaId);
  }

  @Get('ctacontables/:id')
  @ApiOperation({ summary: 'Obtener cuenta contable por ID' })
  @ApiResponse({ status: 200, description: 'Cuenta contable encontrada' })
  @ApiResponse({ status: 404, description: 'Cuenta contable no encontrada' })
  findCtacontable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCtacontable(id, empresaId);
  }

  @Post('ctacontables')
  @ApiOperation({ summary: 'Crear cuenta contable' })
  @ApiResponse({ status: 201, description: 'Cuenta contable creada exitosamente' })
  createCtacontable(@Body() dto: CreateTcoctacontablesDto, @CurrentUser() user: any) {
    return this.service.createCtacontable(dto, user.usuario);
  }

  @Put('ctacontables/:id')
  @ApiOperation({ summary: 'Actualizar cuenta contable' })
  @ApiResponse({ status: 200, description: 'Cuenta contable actualizada exitosamente' })
  updateCtacontable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateTcoctacontablesDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCtacontable(id, empresaId, dto, user.usuario);
  }

  @Put('ctacontables/:id/remove')
  @ApiOperation({ summary: 'Eliminar cuenta contable' })
  @ApiResponse({ status: 200, description: 'Cuenta contable eliminada exitosamente' })
  removeCtacontable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCtacontable(id, empresaId);
  }

  // ===== Grupo Contable =====

  @Get('grupocontable')
  @ApiOperation({ summary: 'Listar grupos contables' })
  @ApiResponse({ status: 200, description: 'Lista de grupos contables obtenida exitosamente' })
  findAllGrupocontable(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllGrupocontable(empresaId);
  }

  @Get('grupocontable/:id')
  @ApiOperation({ summary: 'Obtener grupo contable por ID' })
  @ApiResponse({ status: 200, description: 'Grupo contable encontrado' })
  @ApiResponse({ status: 404, description: 'Grupo contable no encontrado' })
  findGrupocontable(@Param('id', ParseIntPipe) id: number, @Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findGrupocontable(id, empresaId);
  }

  @Post('grupocontable')
  @ApiOperation({ summary: 'Crear grupo contable' })
  @ApiResponse({ status: 201, description: 'Grupo contable creado exitosamente' })
  createGrupocontable(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createGrupocontable(dto, user.usuario);
  }

  @Put('grupocontable/:id')
  @ApiOperation({ summary: 'Actualizar grupo contable' })
  @ApiResponse({ status: 200, description: 'Grupo contable actualizado exitosamente' })
  updateGrupocontable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateGrupocontable(id, empresaId, dto, user.usuario);
  }

  @Put('grupocontable/:id/remove')
  @ApiOperation({ summary: 'Eliminar grupo contable' })
  @ApiResponse({ status: 200, description: 'Grupo contable eliminado exitosamente' })
  removeGrupocontable(@Param('id', ParseIntPipe) id: number, @Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.removeGrupocontable(id, empresaId);
  }

  // ===== Plantilla PDAMAE =====

  @Get('plantillapdamae')
  @ApiOperation({ summary: 'Listar plantillas pda maestro' })
  @ApiResponse({ status: 200, description: 'Lista de plantillas obtenida exitosamente' })
  findAllPlantillapdamae(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlantillapdamae(empresaId);
  }

  @Get('plantillapdamae/:id')
  @ApiOperation({ summary: 'Obtener plantilla pda maestro por ID' })
  @ApiResponse({ status: 200, description: 'Plantilla encontrada' })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
  findPlantillapdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlantillapdamae(id, empresaId);
  }

  @Post('plantillapdamae')
  @ApiOperation({ summary: 'Crear plantilla pda maestro' })
  @ApiResponse({ status: 201, description: 'Plantilla creada exitosamente' })
  createPlantillapdamae(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPlantillapdamae(dto, user.usuario);
  }

  @Put('plantillapdamae/:id')
  @ApiOperation({ summary: 'Actualizar plantilla pda maestro' })
  @ApiResponse({ status: 200, description: 'Plantilla actualizada exitosamente' })
  updatePlantillapdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlantillapdamae(id, empresaId, dto, user.usuario);
  }

  @Put('plantillapdamae/:id/remove')
  @ApiOperation({ summary: 'Eliminar plantilla pda maestro' })
  @ApiResponse({ status: 200, description: 'Plantilla eliminada exitosamente' })
  removePlantillapdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePlantillapdamae(id, empresaId);
  }

  // ===== Plantilla PDADET =====

  @Get('plantillapdadet')
  @ApiOperation({ summary: 'Listar plantillas pda detalle' })
  @ApiResponse({ status: 200, description: 'Lista de plantillas detalle obtenida exitosamente' })
  findAllPlantillapdadet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlantillapdadet(empresaId);
  }

  @Get('plantillapdadet/:id')
  @ApiOperation({ summary: 'Obtener plantilla pda detalle por ID' })
  @ApiResponse({ status: 200, description: 'Plantilla detalle encontrada' })
  @ApiResponse({ status: 404, description: 'Plantilla detalle no encontrada' })
  findPlantillapdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlantillapdadet(id, empresaId);
  }

  @Post('plantillapdadet')
  @ApiOperation({ summary: 'Crear plantilla pda detalle' })
  @ApiResponse({ status: 201, description: 'Plantilla detalle creada exitosamente' })
  createPlantillapdadet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPlantillapdadet(dto, user.usuario);
  }

  @Put('plantillapdadet/:id')
  @ApiOperation({ summary: 'Actualizar plantilla pda detalle' })
  @ApiResponse({ status: 200, description: 'Plantilla detalle actualizada exitosamente' })
  updatePlantillapdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlantillapdadet(id, empresaId, dto, user.usuario);
  }

  @Put('plantillapdadet/:id/remove')
  @ApiOperation({ summary: 'Eliminar plantilla pda detalle' })
  @ApiResponse({ status: 200, description: 'Plantilla detalle eliminada exitosamente' })
  removePlantillapdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePlantillapdadet(id, empresaId);
  }

  // ===== Saldos Cta =====

  @Get('saldoscta')
  @ApiOperation({ summary: 'Listar saldos de cuentas contables' })
  @ApiResponse({ status: 200, description: 'Lista de saldos obtenida exitosamente' })
  findAllSaldoscta(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllSaldoscta(empresaId);
  }

  @Get('saldoscta/:id')
  @ApiOperation({ summary: 'Obtener saldo de cuenta contable por ID' })
  @ApiResponse({ status: 200, description: 'Saldo encontrado' })
  @ApiResponse({ status: 404, description: 'Saldo no encontrado' })
  findSaldoscta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findSaldoscta(id, empresaId);
  }

  @Post('saldoscta')
  @ApiOperation({ summary: 'Crear saldo de cuenta contable' })
  @ApiResponse({ status: 201, description: 'Saldo creado exitosamente' })
  createSaldoscta(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createSaldoscta(dto, user.usuario);
  }

  @Put('saldoscta/:id')
  @ApiOperation({ summary: 'Actualizar saldo de cuenta contable' })
  @ApiResponse({ status: 200, description: 'Saldo actualizado exitosamente' })
  updateSaldoscta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateSaldoscta(id, empresaId, dto, user.usuario);
  }

  // ===== Cierre Table =====

  @Get('cierrectable')
  @ApiOperation({ summary: 'Listar cierres de tabla' })
  @ApiResponse({ status: 200, description: 'Lista de cierres de tabla obtenida exitosamente' })
  findAllCierrectable(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCierrectable(empresaId);
  }

  @Get('cierrectable/:id')
  @ApiOperation({ summary: 'Obtener cierre de tabla por ID' })
  @ApiResponse({ status: 200, description: 'Cierre de tabla encontrado' })
  @ApiResponse({ status: 404, description: 'Cierre de tabla no encontrado' })
  findCierrectable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCierrectable(id, empresaId);
  }

  @Post('cierrectable')
  @ApiOperation({ summary: 'Crear cierre de tabla' })
  @ApiResponse({ status: 201, description: 'Cierre de tabla creado exitosamente' })
  createCierrectable(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCierrectable(dto, user.usuario);
  }

  @Put('cierrectable/:id')
  @ApiOperation({ summary: 'Actualizar cierre de tabla' })
  @ApiResponse({ status: 200, description: 'Cierre de tabla actualizado exitosamente' })
  updateCierrectable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCierrectable(id, empresaId, dto, user.usuario);
  }

  @Put('cierrectable/:id/remove')
  @ApiOperation({ summary: 'Eliminar cierre de tabla' })
  @ApiResponse({ status: 200, description: 'Cierre de tabla eliminado exitosamente' })
  removeCierrectable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCierrectable(id, empresaId);
  }

  // ===== Repliquidez =====

  @Get('repliquidez')
  @ApiOperation({ summary: 'Listar reportes de liquidez' })
  @ApiResponse({ status: 200, description: 'Lista de reportes de liquidez obtenida exitosamente' })
  findAllRepliquidez(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllRepliquidez(empresaId);
  }

  @Get('repliquidez/:id')
  @ApiOperation({ summary: 'Obtener reporte de liquidez por ID' })
  @ApiResponse({ status: 200, description: 'Reporte de liquidez encontrado' })
  @ApiResponse({ status: 404, description: 'Reporte de liquidez no encontrado' })
  findRepliquidez(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRepliquidez(id);
  }

  @Post('repliquidez')
  @ApiOperation({ summary: 'Crear reporte de liquidez' })
  @ApiResponse({ status: 201, description: 'Reporte de liquidez creado exitosamente' })
  createRepliquidez(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createRepliquidez(dto, user.usuario);
  }

  @Put('repliquidez/:id')
  @ApiOperation({ summary: 'Actualizar reporte de liquidez' })
  @ApiResponse({ status: 200, description: 'Reporte de liquidez actualizado exitosamente' })
  updateRepliquidez(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateRepliquidez(id, dto, user.usuario);
  }

  @Put('repliquidez/:id/remove')
  @ApiOperation({ summary: 'Eliminar reporte de liquidez' })
  @ApiResponse({ status: 200, description: 'Reporte de liquidez eliminado exitosamente' })
  removeRepliquidez(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeRepliquidez(id);
  }

  // ===== Factor de Cambio =====

  @Get('factordecambio')
  @ApiOperation({ summary: 'Listar factores de cambio' })
  @ApiResponse({ status: 200, description: 'Lista de factores de cambio obtenida exitosamente' })
  findAllFactordecambio(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFactordecambio(empresaId);
  }

  @Get('factordecambio/:id')
  @ApiOperation({ summary: 'Obtener factor de cambio por ID' })
  @ApiResponse({ status: 200, description: 'Factor de cambio encontrado' })
  @ApiResponse({ status: 404, description: 'Factor de cambio no encontrado' })
  findFactordecambio(@Param('id', ParseIntPipe) id: number) {
    return this.service.findFactordecambio(id);
  }

  @Post('factordecambio')
  @ApiOperation({ summary: 'Crear factor de cambio' })
  @ApiResponse({ status: 201, description: 'Factor de cambio creado exitosamente' })
  createFactordecambio(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createFactordecambio(dto, user.usuario);
  }

  @Put('factordecambio/:id')
  @ApiOperation({ summary: 'Actualizar factor de cambio' })
  @ApiResponse({ status: 200, description: 'Factor de cambio actualizado exitosamente' })
  updateFactordecambio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFactordecambio(id, dto, user.usuario);
  }

  // ===== Plantilla Balances MAE =====

  @Get('plantillabalancesmae')
  @ApiOperation({ summary: 'Listar plantillas de balances maestro' })
  @ApiResponse({ status: 200, description: 'Lista de plantillas de balances obtenida exitosamente' })
  findAllPlantillabalancesmae(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlantillabalancesmae(empresaId);
  }

  @Get('plantillabalancesmae/:id')
  @ApiOperation({ summary: 'Obtener plantilla de balances maestro por ID' })
  @ApiResponse({ status: 200, description: 'Plantilla de balances encontrada' })
  @ApiResponse({ status: 404, description: 'Plantilla de balances no encontrada' })
  findPlantillabalancesmae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlantillabalancesmae(id, empresaId);
  }

  @Post('plantillabalancesmae')
  @ApiOperation({ summary: 'Crear plantilla de balances maestro' })
  @ApiResponse({ status: 201, description: 'Plantilla de balances creada exitosamente' })
  createPlantillabalancesmae(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPlantillabalancesmae(dto, user.usuario);
  }

  @Put('plantillabalancesmae/:id')
  @ApiOperation({ summary: 'Actualizar plantilla de balances maestro' })
  @ApiResponse({ status: 200, description: 'Plantilla de balances actualizada exitosamente' })
  updatePlantillabalancesmae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlantillabalancesmae(id, empresaId, dto, user.usuario);
  }

  @Put('plantillabalancesmae/:id/remove')
  @ApiOperation({ summary: 'Eliminar plantilla de balances maestro' })
  @ApiResponse({ status: 200, description: 'Plantilla de balances eliminada exitosamente' })
  removePlantillabalancesmae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePlantillabalancesmae(id, empresaId);
  }

  // ===== Plantilla Balances DET =====

  @Get('plantillabalancesdet')
  @ApiOperation({ summary: 'Listar plantillas de balances detalle' })
  @ApiResponse({ status: 200, description: 'Lista de plantillas de balances detalle obtenida exitosamente' })
  findAllPlantillabalancesdet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlantillabalancesdet(empresaId);
  }

  @Get('plantillabalancesdet/:id')
  @ApiOperation({ summary: 'Obtener plantilla de balances detalle por ID' })
  @ApiResponse({ status: 200, description: 'Plantilla de balances detalle encontrada' })
  @ApiResponse({ status: 404, description: 'Plantilla de balances detalle no encontrada' })
  findPlantillabalancesdet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlantillabalancesdet(id, empresaId);
  }

  @Post('plantillabalancesdet')
  @ApiOperation({ summary: 'Crear plantilla de balances detalle' })
  @ApiResponse({ status: 201, description: 'Plantilla de balances detalle creada exitosamente' })
  createPlantillabalancesdet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPlantillabalancesdet(dto, user.usuario);
  }

  @Put('plantillabalancesdet/:id')
  @ApiOperation({ summary: 'Actualizar plantilla de balances detalle' })
  @ApiResponse({ status: 200, description: 'Plantilla de balances detalle actualizada exitosamente' })
  updatePlantillabalancesdet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlantillabalancesdet(id, empresaId, dto, user.usuario);
  }

  @Put('plantillabalancesdet/:id/remove')
  @ApiOperation({ summary: 'Eliminar plantilla de balances detalle' })
  @ApiResponse({ status: 200, description: 'Plantilla de balances detalle eliminada exitosamente' })
  removePlantillabalancesdet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePlantillabalancesdet(id, empresaId);
  }

  // ===== Rep Diarios =====

  @Get('repdiarios')
  @ApiOperation({ summary: 'Listar reportes diarios' })
  @ApiResponse({ status: 200, description: 'Lista de reportes diarios obtenida exitosamente' })
  findAllRepdiarios(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllRepdiarios(empresaId);
  }

  @Get('repdiarios/:id')
  @ApiOperation({ summary: 'Obtener reporte diario por ID' })
  @ApiResponse({ status: 200, description: 'Reporte diario encontrado' })
  @ApiResponse({ status: 404, description: 'Reporte diario no encontrado' })
  findRepdiarios(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRepdiarios(id);
  }

  @Post('repdiarios')
  @ApiOperation({ summary: 'Crear reporte diario' })
  @ApiResponse({ status: 201, description: 'Reporte diario creado exitosamente' })
  createRepdiarios(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createRepdiarios(dto, user.usuario);
  }

  @Put('repdiarios/:id')
  @ApiOperation({ summary: 'Actualizar reporte diario' })
  @ApiResponse({ status: 200, description: 'Reporte diario actualizado exitosamente' })
  updateRepdiarios(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateRepdiarios(id, dto, user.usuario);
  }

  @Put('repdiarios/:id/remove')
  @ApiOperation({ summary: 'Eliminar reporte diario' })
  @ApiResponse({ status: 200, description: 'Reporte diario eliminado exitosamente' })
  removeRepdiarios(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeRepdiarios(id);
  }

  // ===== Rep Balances =====

  @Get('repbalances')
  @ApiOperation({ summary: 'Listar reportes de balances' })
  @ApiResponse({ status: 200, description: 'Lista de reportes de balances obtenida exitosamente' })
  findAllRepbalances(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllRepbalances(empresaId);
  }

  @Get('repbalances/:id')
  @ApiOperation({ summary: 'Obtener reporte de balance por ID' })
  @ApiResponse({ status: 200, description: 'Reporte de balance encontrado' })
  @ApiResponse({ status: 404, description: 'Reporte de balance no encontrado' })
  findRepbalances(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRepbalances(id);
  }

  @Post('repbalances')
  @ApiOperation({ summary: 'Crear reporte de balance' })
  @ApiResponse({ status: 201, description: 'Reporte de balance creado exitosamente' })
  createRepbalances(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createRepbalances(dto, user.usuario);
  }

  @Put('repbalances/:id')
  @ApiOperation({ summary: 'Actualizar reporte de balance' })
  @ApiResponse({ status: 200, description: 'Reporte de balance actualizado exitosamente' })
  updateRepbalances(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateRepbalances(id, dto, user.usuario);
  }

  // ===== Periodo Cta Table =====

  @Get('periodoctable')
  @ApiOperation({ summary: 'Listar períodos contables' })
  @ApiResponse({ status: 200, description: 'Lista de períodos contables obtenida exitosamente' })
  findAllPeriodoctable(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPeriodoctable(empresaId);
  }

  @Get('periodoctable/:id')
  @ApiOperation({ summary: 'Obtener período contable por ID' })
  @ApiResponse({ status: 200, description: 'Período contable encontrado' })
  @ApiResponse({ status: 404, description: 'Período contable no encontrado' })
  findPeriodoctable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPeriodoctable(id, empresaId);
  }

  @Post('periodoctable')
  @ApiOperation({ summary: 'Crear período contable' })
  @ApiResponse({ status: 201, description: 'Período contable creado exitosamente' })
  createPeriodoctable(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPeriodoctable(dto, user.usuario);
  }

  @Put('periodoctable/:id')
  @ApiOperation({ summary: 'Actualizar período contable' })
  @ApiResponse({ status: 200, description: 'Período contable actualizado exitosamente' })
  updatePeriodoctable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePeriodoctable(id, empresaId, dto, user.usuario);
  }

  @Put('periodoctable/:id/remove')
  @ApiOperation({ summary: 'Eliminar período contable' })
  @ApiResponse({ status: 200, description: 'Período contable eliminado exitosamente' })
  removePeriodoctable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePeriodoctable(id, empresaId);
  }

  // ===== Copdamae =====

  @Get('copdamae')
  @ApiOperation({ summary: 'Listar copdamae' })
  @ApiResponse({ status: 200, description: 'Lista de copdamae obtenida exitosamente' })
  findAllCopdamae(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCopdamae(empresaId);
  }

  @Get('copdamae/:id')
  @ApiOperation({ summary: 'Obtener copdamae por ID' })
  @ApiResponse({ status: 200, description: 'Copdamae encontrado' })
  @ApiResponse({ status: 404, description: 'Copdamae no encontrado' })
  findCopdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCopdamae(id, empresaId);
  }

  @Post('copdamae')
  @ApiOperation({ summary: 'Crear copdamae' })
  @ApiResponse({ status: 201, description: 'Copdamae creado exitosamente' })
  createCopdamae(@Body() dto: CreateCopdamaeDto, @CurrentUser() user: any) {
    return this.service.createCopdamae(dto, user.usuario);
  }

  @Put('copdamae/:id')
  @ApiOperation({ summary: 'Actualizar copdamae' })
  @ApiResponse({ status: 200, description: 'Copdamae actualizado exitosamente' })
  updateCopdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCopdamaeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCopdamae(id, empresaId, dto, user.usuario);
  }

  @Put('copdamae/:id/remove')
  @ApiOperation({ summary: 'Eliminar copdamae' })
  @ApiResponse({ status: 200, description: 'Copdamae eliminado exitosamente' })
  removeCopdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCopdamae(id, empresaId);
  }

  // ===== Copdadet =====

  @Get('copdadet')
  @ApiOperation({ summary: 'Listar copdadet' })
  @ApiResponse({ status: 200, description: 'Lista de copdadet obtenida exitosamente' })
  findAllCopdadet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCopdadet(empresaId);
  }

  @Get('copdadet/:id')
  @ApiOperation({ summary: 'Obtener copdadet por ID' })
  @ApiResponse({ status: 200, description: 'Copdadet encontrado' })
  @ApiResponse({ status: 404, description: 'Copdadet no encontrado' })
  findCopdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCopdadet(id, empresaId);
  }

  @Post('copdadet')
  @ApiOperation({ summary: 'Crear copdadet' })
  @ApiResponse({ status: 201, description: 'Copdadet creado exitosamente' })
  createCopdadet(@Body() dto: CreateCopdadetDto, @CurrentUser() user: any) {
    return this.service.createCopdadet(dto, user.usuario);
  }

  @Put('copdadet/:id')
  @ApiOperation({ summary: 'Actualizar copdadet' })
  @ApiResponse({ status: 200, description: 'Copdadet actualizado exitosamente' })
  updateCopdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCopdadetDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCopdadet(id, empresaId, dto, user.usuario);
  }

  @Put('copdadet/:id/remove')
  @ApiOperation({ summary: 'Eliminar copdadet' })
  @ApiResponse({ status: 200, description: 'Copdadet eliminado exitosamente' })
  removeCopdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCopdadet(id, empresaId);
  }

  // ===== Mov Cta =====

  @Get('movcta')
  @ApiOperation({ summary: 'Listar movimientos de cuenta' })
  @ApiResponse({ status: 200, description: 'Lista de movimientos de cuenta obtenida exitosamente' })
  findAllMovcta(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMovcta(empresaId);
  }

  @Get('movcta/:id')
  @ApiOperation({ summary: 'Obtener movimiento de cuenta por ID' })
  @ApiResponse({ status: 200, description: 'Movimiento de cuenta encontrado' })
  @ApiResponse({ status: 404, description: 'Movimiento de cuenta no encontrado' })
  findMovcta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMovcta(id, empresaId);
  }

  @Post('movcta')
  @ApiOperation({ summary: 'Crear movimiento de cuenta' })
  @ApiResponse({ status: 201, description: 'Movimiento de cuenta creado exitosamente' })
  createMovcta(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createMovcta(dto, user.usuario);
  }

  @Put('movcta/:id')
  @ApiOperation({ summary: 'Actualizar movimiento de cuenta' })
  @ApiResponse({ status: 200, description: 'Movimiento de cuenta actualizado exitosamente' })
  updateMovcta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMovcta(id, empresaId, dto, user.usuario);
  }

  // ===== Nivel Cta =====

  @Get('nivelcta')
  @ApiOperation({ summary: 'Listar niveles de cuenta' })
  @ApiResponse({ status: 200, description: 'Lista de niveles de cuenta obtenida exitosamente' })
  findAllNivelcta(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllNivelcta(empresaId);
  }

  @Get('nivelcta/:id')
  @ApiOperation({ summary: 'Obtener nivel de cuenta por ID' })
  @ApiResponse({ status: 200, description: 'Nivel de cuenta encontrado' })
  @ApiResponse({ status: 404, description: 'Nivel de cuenta no encontrado' })
  findNivelcta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findNivelcta(id, empresaId);
  }

  @Post('nivelcta')
  @ApiOperation({ summary: 'Crear nivel de cuenta' })
  @ApiResponse({ status: 201, description: 'Nivel de cuenta creado exitosamente' })
  createNivelcta(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createNivelcta(dto, user.usuario);
  }

  @Put('nivelcta/:id')
  @ApiOperation({ summary: 'Actualizar nivel de cuenta' })
  @ApiResponse({ status: 200, description: 'Nivel de cuenta actualizado exitosamente' })
  updateNivelcta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateNivelcta(id, empresaId, dto, user.usuario);
  }

  @Put('nivelcta/:id/remove')
  @ApiOperation({ summary: 'Eliminar nivel de cuenta' })
  @ApiResponse({ status: 200, description: 'Nivel de cuenta eliminado exitosamente' })
  removeNivelcta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeNivelcta(id, empresaId);
  }

  // ===== Naturaleza Cta =====

  @Get('naturalezacta')
  @ApiOperation({ summary: 'Listar naturalezas de cuenta' })
  @ApiResponse({ status: 200, description: 'Lista de naturalezas de cuenta obtenida exitosamente' })
  findAllNaturalezacta(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllNaturalezacta(empresaId);
  }

  @Get('naturalezacta/:id')
  @ApiOperation({ summary: 'Obtener naturaleza de cuenta por ID' })
  @ApiResponse({ status: 200, description: 'Naturaleza de cuenta encontrada' })
  @ApiResponse({ status: 404, description: 'Naturaleza de cuenta no encontrada' })
  findNaturalezacta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findNaturalezacta(id, empresaId);
  }

  @Post('naturalezacta')
  @ApiOperation({ summary: 'Crear naturaleza de cuenta' })
  @ApiResponse({ status: 201, description: 'Naturaleza de cuenta creada exitosamente' })
  createNaturalezacta(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createNaturalezacta(dto, user.usuario);
  }

  @Put('naturalezacta/:id')
  @ApiOperation({ summary: 'Actualizar naturaleza de cuenta' })
  @ApiResponse({ status: 200, description: 'Naturaleza de cuenta actualizada exitosamente' })
  updateNaturalezacta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateNaturalezacta(id, empresaId, dto, user.usuario);
  }

  // ===== Impuesto Vecinal =====

  @Get('impuestovecinal')
  @ApiOperation({ summary: 'Listar impuestos vecinales' })
  @ApiResponse({ status: 200, description: 'Lista de impuestos vecinales obtenida exitosamente' })
  findAllImpuestovecinal(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllImpuestovecinal(empresaId);
  }

  @Get('impuestovecinal/:id')
  @ApiOperation({ summary: 'Obtener impuesto vecinal por ID' })
  @ApiResponse({ status: 200, description: 'Impuesto vecinal encontrado' })
  @ApiResponse({ status: 404, description: 'Impuesto vecinal no encontrado' })
  findImpuestovecinal(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findImpuestovecinal(id, empresaId);
  }

  @Post('impuestovecinal')
  @ApiOperation({ summary: 'Crear impuesto vecinal' })
  @ApiResponse({ status: 201, description: 'Impuesto vecinal creado exitosamente' })
  createImpuestovecinal(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createImpuestovecinal(dto, user.usuario);
  }

  @Put('impuestovecinal/:id')
  @ApiOperation({ summary: 'Actualizar impuesto vecinal' })
  @ApiResponse({ status: 200, description: 'Impuesto vecinal actualizado exitosamente' })
  updateImpuestovecinal(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateImpuestovecinal(id, empresaId, dto, user.usuario);
  }

  @Put('impuestovecinal/:id/remove')
  @ApiOperation({ summary: 'Eliminar impuesto vecinal' })
  @ApiResponse({ status: 200, description: 'Impuesto vecinal eliminado exitosamente' })
  removeImpuestovecinal(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeImpuestovecinal(id, empresaId);
  }

  // ===== Tipos Doc Fiscal =====

  @Get('tipos-doc-fiscal')
  @ApiOperation({ summary: 'Listar tipos de documento fiscal' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de documento fiscal obtenida exitosamente' })
  findAllTipoDocFiscal(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTipoDocFiscal(empresaId);
  }

  @Get('tipos-doc-fiscal/:id')
  @ApiOperation({ summary: 'Obtener tipo de documento fiscal por ID' })
  @ApiResponse({ status: 200, description: 'Tipo de documento fiscal encontrado' })
  @ApiResponse({ status: 404, description: 'Tipo de documento fiscal no encontrado' })
  findTipoDocFiscal(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTipoDocFiscal(id, empresaId);
  }

  @Post('tipos-doc-fiscal')
  @ApiOperation({ summary: 'Crear tipo de documento fiscal' })
  @ApiResponse({ status: 201, description: 'Tipo de documento fiscal creado exitosamente' })
  createTipoDocFiscal(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createTipoDocFiscal(dto, user.usuario);
  }

  @Put('tipos-doc-fiscal/:id')
  @ApiOperation({ summary: 'Actualizar tipo de documento fiscal' })
  @ApiResponse({ status: 200, description: 'Tipo de documento fiscal actualizado exitosamente' })
  updateTipoDocFiscal(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTipoDocFiscal(id, empresaId, dto, user.usuario);
  }
}
