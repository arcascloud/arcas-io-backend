import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlanillaService } from './planilla.service';
import { CreatePlEmpleadosDto, UpdatePlEmpleadosDto } from './dto/plplempleados.dto';
import { CreatePlPlaMaeDto, UpdatePlPlaMaeDto } from './dto/pleplamae.dto';
import { CreatePlPlaDetDto, UpdatePlPlaDetDto } from './dto/plepladet.dto';
import { CreatePlTipoMovDto, UpdatePlTipoMovDto, DarDerechosLaboralesDto } from './dto/pletipomov.dto';
import { CreatePlIngresosDto, UpdatePlIngresosDto } from './dto/pleingresos.dto';
import {
  CreateAuthoraExMaeDto,
  UpdateAuthoraExMaeDto,
  CreateAuthoraExDetDto,
  UpdateAuthoraExDetDto,
} from './dto/authoraex.dto';
import { CreateTplTipoMovDto, UpdateTplTipoMovDto } from './dto/tpltipomov.dto';
import { CreateTplIngresosDto, UpdateTplIngresosDto } from './dto/tplingresos.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Planilla')
@ApiBearerAuth()
@Controller('planilla')
@UseGuards(JwtAuthGuard)
export class PlanillaController {
  constructor(private readonly service: PlanillaService) {}

  @Get('empleados')
  @ApiOperation({ summary: 'Listar empleados' })
  @ApiResponse({ status: 200, description: 'Lista de empleados obtenida exitosamente' })
  findAllEmpleados(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllEmpleados(empresaId);
  }

  @Get('empleados/:id')
  @ApiOperation({ summary: 'Obtener empleado por ID' })
  @ApiResponse({ status: 200, description: 'Empleado encontrado' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  findEmpleado(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findEmpleado(id, empresaId);
  }

  @Post('empleados')
  @ApiOperation({ summary: 'Crear empleado' })
  @ApiResponse({ status: 201, description: 'Empleado creado exitosamente' })
  createEmpleado(@Body() dto: CreatePlEmpleadosDto, @CurrentUser() user: any) {
    return this.service.createEmpleado(dto, user.usuario);
  }

  @Put('empleados/:id')
  @ApiOperation({ summary: 'Actualizar empleado' })
  @ApiResponse({ status: 200, description: 'Empleado actualizado exitosamente' })
  updateEmpleado(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePlEmpleadosDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateEmpleado(id, empresaId, dto, user.usuario);
  }

  @Get('titulaciones')
  @ApiOperation({ summary: 'Listar titulaciones' })
  @ApiResponse({ status: 200, description: 'Lista de titulaciones obtenida exitosamente' })
  findAllTitulaciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTitulaciones(empresaId);
  }

  @Get('titulaciones/:id')
  @ApiOperation({ summary: 'Obtener titulación por ID' })
  @ApiResponse({ status: 200, description: 'Titulación encontrada' })
  @ApiResponse({ status: 404, description: 'Titulación no encontrada' })
  findTitulacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTitulacion(id, empresaId);
  }

  @Post('titulaciones')
  @ApiOperation({ summary: 'Crear titulación' })
  @ApiResponse({ status: 201, description: 'Titulación creada exitosamente' })
  createTitulacion(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createTitulacion(dto, user.usuario);
  }

  @Put('titulaciones/:id')
  @ApiOperation({ summary: 'Actualizar titulación' })
  @ApiResponse({ status: 200, description: 'Titulación actualizada exitosamente' })
  updateTitulacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTitulacion(id, empresaId, dto, user.usuario);
  }

  @Get('asistencia')
  @ApiOperation({ summary: 'Listar asistencias' })
  @ApiResponse({ status: 200, description: 'Lista de asistencias obtenida exitosamente' })
  findAllAsistencia(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllAsistencia(empresaId);
  }

  @Get('asistencia/:id')
  @ApiOperation({ summary: 'Obtener asistencia por ID' })
  @ApiResponse({ status: 200, description: 'Asistencia encontrada' })
  @ApiResponse({ status: 404, description: 'Asistencia no encontrada' })
  findAsistencia(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findAsistencia(id, empresaId);
  }

  @Post('asistencia')
  @ApiOperation({ summary: 'Crear asistencia' })
  @ApiResponse({ status: 201, description: 'Asistencia creada exitosamente' })
  createAsistencia(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createAsistencia(dto, user.usuario);
  }

  @Put('asistencia/:id')
  @ApiOperation({ summary: 'Actualizar asistencia' })
  @ApiResponse({ status: 200, description: 'Asistencia actualizada exitosamente' })
  updateAsistencia(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateAsistencia(id, empresaId, dto, user.usuario);
  }

  @Get('certificaciones')
  @ApiOperation({ summary: 'Listar certificaciones' })
  @ApiResponse({ status: 200, description: 'Lista de certificaciones obtenida exitosamente' })
  findAllCertificaciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCertificaciones(empresaId);
  }

  @Get('certificaciones/:id')
  @ApiOperation({ summary: 'Obtener certificación por ID' })
  @ApiResponse({ status: 200, description: 'Certificación encontrada' })
  @ApiResponse({ status: 404, description: 'Certificación no encontrada' })
  findCertificacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCertificacion(id, empresaId);
  }

  @Post('certificaciones')
  @ApiOperation({ summary: 'Crear certificación' })
  @ApiResponse({ status: 201, description: 'Certificación creada exitosamente' })
  createCertificacion(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCertificacion(dto, user.usuario);
  }

  @Put('certificaciones/:id')
  @ApiOperation({ summary: 'Actualizar certificación' })
  @ApiResponse({ status: 200, description: 'Certificación actualizada exitosamente' })
  updateCertificacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCertificacion(id, empresaId, dto, user.usuario);
  }

  @Get('ple-ingresos')
  @ApiOperation({ summary: 'Listar ingresos autorizados (comisiones y bonos)' })
  @ApiResponse({ status: 200, description: 'Lista de ingresos autorizados obtenida exitosamente' })
  findAllPleIngresos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPleIngresos(empresaId);
  }

  @Get('ple-ingresos/:id')
  @ApiOperation({ summary: 'Obtener ingreso autorizado por ID' })
  @ApiResponse({ status: 200, description: 'Ingreso autorizado encontrado' })
  @ApiResponse({ status: 404, description: 'Ingreso autorizado no encontrado' })
  findPleIngreso(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPleIngreso(id, empresaId);
  }

  @Post('ple-ingresos')
  @ApiOperation({ summary: 'Crear ingreso autorizado (comisión o bono)' })
  @ApiResponse({ status: 201, description: 'Ingreso autorizado creado exitosamente' })
  createPleIngreso(@Body() dto: CreatePlIngresosDto, @CurrentUser() user: any) {
    return this.service.createPleIngreso(dto, user.usuario);
  }

  @Put('ple-ingresos/:id')
  @ApiOperation({ summary: 'Actualizar ingreso autorizado' })
  @ApiResponse({ status: 200, description: 'Ingreso autorizado actualizado exitosamente' })
  updatePleIngreso(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePlIngresosDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePleIngreso(id, empresaId, dto, user.usuario);
  }

  @Delete('ple-ingresos/:id')
  @ApiOperation({ summary: 'Eliminar ingreso autorizado' })
  @ApiResponse({ status: 200, description: 'Ingreso autorizado eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Ingreso autorizado no encontrado' })
  removePleIngreso(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePleIngreso(id, empresaId);
  }

  /* ── Autorización de pago de horas extras ─────────────────────────────── */

  @Get('authoraex')
  @ApiOperation({ summary: 'Listar autorizaciones de pago de horas extras' })
  @ApiResponse({ status: 200, description: 'Lista de autorizaciones obtenida exitosamente' })
  findAllAuthoraEx(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllAuthoraExMae(empresaId);
  }

  // Rutas estáticas `/det` antes que `/ :id` para que "det" no se interprete como un id
  @Post('authoraex/det')
  @ApiOperation({ summary: 'Agregar empleado autorizado al detalle de horas extras' })
  @ApiResponse({ status: 201, description: 'Detalle creado exitosamente' })
  @ApiResponse({ status: 409, description: 'El empleado ya estaba autorizado en esta solicitud' })
  createAuthoraExDet(@Body() dto: CreateAuthoraExDetDto, @CurrentUser() user: any) {
    return this.service.createAuthoraExDet(dto, user.usuario);
  }

  @Put('authoraex/det/:id')
  @ApiOperation({ summary: 'Actualizar línea del detalle de horas extras' })
  @ApiResponse({ status: 200, description: 'Detalle actualizado exitosamente' })
  updateAuthoraExDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateAuthoraExDetDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateAuthoraExDet(id, empresaId, dto, user.usuario);
  }

  @Delete('authoraex/det/:id')
  @ApiOperation({ summary: 'Quitar empleado autorizado del detalle de horas extras' })
  @ApiResponse({ status: 200, description: 'Detalle eliminado exitosamente' })
  removeAuthoraExDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeAuthoraExDet(id, empresaId);
  }

  @Get('authoraex/:id')
  @ApiOperation({ summary: 'Obtener autorización de horas extras con su detalle' })
  @ApiResponse({ status: 200, description: 'Autorización encontrada' })
  @ApiResponse({ status: 404, description: 'Autorización no encontrada' })
  findAuthoraEx(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findAuthoraExMae(id, empresaId);
  }

  @Get('authoraex/:id/horas-extras')
  @ApiOperation({
    summary: 'Horas extras a pagar: empleados autorizados con asistencia dentro del rango',
  })
  @ApiResponse({ status: 200, description: 'Resumen de horas extras calculado' })
  @ApiResponse({ status: 400, description: 'La autorización no tiene rango de fechas' })
  findAuthoraExHorasExtras(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findAuthoraExHorasExtras(id, empresaId);
  }

  @Post('authoraex')
  @ApiOperation({ summary: 'Crear autorización de pago de horas extras' })
  @ApiResponse({ status: 201, description: 'Autorización creada exitosamente' })
  createAuthoraEx(@Body() dto: CreateAuthoraExMaeDto, @CurrentUser() user: any) {
    return this.service.createAuthoraExMae(dto, user.usuario);
  }

  @Put('authoraex/:id')
  @ApiOperation({ summary: 'Actualizar autorización de pago de horas extras' })
  @ApiResponse({ status: 200, description: 'Autorización actualizada exitosamente' })
  updateAuthoraEx(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateAuthoraExMaeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateAuthoraExMae(id, empresaId, dto, user.usuario);
  }

  @Delete('authoraex/:id')
  @ApiOperation({ summary: 'Eliminar autorización de pago de horas extras (y su detalle)' })
  @ApiResponse({ status: 200, description: 'Autorización eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Autorización no encontrada' })
  removeAuthoraEx(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeAuthoraExMae(id, empresaId);
  }

  @Get('deducciones-emp')
  @ApiOperation({ summary: 'Listar deducciones de empleado' })
  @ApiResponse({ status: 200, description: 'Lista de deducciones de empleado obtenida exitosamente' })
  findAllDeduccionesEmp(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDeduccionesEmp(empresaId);
  }

  @Get('deducciones-emp/:id')
  @ApiOperation({ summary: 'Obtener deducción de empleado por ID' })
  @ApiResponse({ status: 200, description: 'Deducción de empleado encontrada' })
  @ApiResponse({ status: 404, description: 'Deducción de empleado no encontrada' })
  findDeduccionEmp(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDeduccionEmp(id, empresaId);
  }

  @Post('deducciones-emp')
  @ApiOperation({ summary: 'Crear deducción de empleado' })
  @ApiResponse({ status: 201, description: 'Deducción de empleado creada exitosamente' })
  createDeduccionEmp(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDeduccionEmp(dto, user.usuario);
  }

  @Put('deducciones-emp/:id')
  @ApiOperation({ summary: 'Actualizar deducción de empleado' })
  @ApiResponse({ status: 200, description: 'Deducción de empleado actualizada exitosamente' })
  updateDeduccionEmp(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDeduccionEmp(id, empresaId, dto, user.usuario);
  }

  @Get('planillas')
  @ApiOperation({ summary: 'Listar planillas' })
  @ApiResponse({ status: 200, description: 'Lista de planillas obtenida exitosamente' })
  findAllPlanillas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlanillas(empresaId);
  }

  @Get('planillas/:id')
  @ApiOperation({ summary: 'Obtener planilla por ID' })
  @ApiResponse({ status: 200, description: 'Planilla encontrada' })
  @ApiResponse({ status: 404, description: 'Planilla no encontrada' })
  findPlanilla(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlanilla(id, empresaId);
  }

  @Post('planillas')
  @ApiOperation({ summary: 'Crear planilla' })
  @ApiResponse({ status: 201, description: 'Planilla creada exitosamente' })
  createPlanilla(@Body() dto: CreatePlPlaMaeDto, @CurrentUser() user: any) {
    return this.service.createPlanilla(dto, user.usuario);
  }

  @Put('planillas/:id')
  @ApiOperation({ summary: 'Actualizar planilla' })
  @ApiResponse({ status: 200, description: 'Planilla actualizada exitosamente' })
  updatePlanilla(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePlPlaMaeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlanilla(id, empresaId, dto, user.usuario);
  }

  @Post('planillas/:id/calcular-horas-extras')
  @ApiOperation({ summary: 'Calcular e integrar las horas extras del período con la planilla' })
  @ApiResponse({ status: 200, description: 'Horas extras integradas en plepladet y pletipomov' })
  @ApiResponse({ status: 400, description: 'Planilla anulada/pagada, sin líneas o sin autorizaciones del período' })
  @ApiResponse({ status: 404, description: 'Planilla no encontrada' })
  calcularHorasExtrasPlanilla(
    @Param('id', ParseIntPipe) id: number,
    // El POST del frontend inyecta empresaId en el BODY (no en la query);
    // se acepta también por query para mantener el patrón de los GET.
    @Query('empresaId') empresaIdQuery?: string,
    @Body() body?: { empresaId?: number | string },
    @CurrentUser() user?: any,
  ) {
    const empresaId = Number(empresaIdQuery ?? body?.empresaId);
    if (!empresaId || Number.isNaN(empresaId)) {
      throw new BadRequestException('empresaId es requerido');
    }
    return this.service.calcularHorasExtrasPlanilla(id, empresaId, user?.usuario);
  }

  @Post('planillas/:id/generar')
  @ApiOperation({
    summary:
      'Generar planilla con todos los cálculos (IHSS, RAP, RTF y vecinal ÷12, otras deducciones, comisiones por tramo, bonos, horas extras, neto y décimo especial automático)',
  })
  @ApiResponse({ status: 200, description: 'Planilla generada: líneas reemplazadas y totales actualizados' })
  @ApiResponse({ status: 400, description: 'Planilla anulada/pagada o sin empleados activos' })
  @ApiResponse({ status: 404, description: 'Planilla no encontrada' })
  generarPlanilla(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    // empresaId se resuelve desde la propia planilla (pleplamae.empresaId)
    return this.service.generarPlanilla(id, user.usuario);
  }

  @Post('planillas/:id/autorizar')
  @ApiOperation({
    summary: 'Autorizar pago de planilla (paso 2 del flujo: Generar → Autorizar → Contabilizar)',
  })
  @ApiResponse({ status: 200, description: 'Planilla autorizada (sn_autorizada=S)' })
  @ApiResponse({ status: 400, description: 'Anulada, pagada, sin líneas o ya autorizada' })
  @ApiResponse({ status: 404, description: 'Planilla no encontrada' })
  autorizarPlanilla(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.autorizarPlanilla(id, user.usuario);
  }

  @Post('planillas/:id/contabilizar')
  @ApiOperation({
    summary:
      'Contabilizar planilla: valida fondos en la cuenta bancaria seleccionada '
      + '(saldo ≥ total a pagar) y marca sn_contabilizada=S (la partida contable se integra después)',
  })
  @ApiResponse({ status: 200, description: 'Planilla contabilizada (sn_contabilizada=S)' })
  @ApiResponse({ status: 400, description: 'Fondos insuficientes o flujo inválido (no autorizada, sin líneas, etc.)' })
  @ApiResponse({ status: 404, description: 'Planilla no encontrada' })
  contabilizarPlanilla(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.contabilizarPlanilla(id, user.usuario);
  }

  @Get('planilla-det')
  @ApiOperation({ summary: 'Listar detalle de planilla' })
  @ApiResponse({ status: 200, description: 'Lista de detalle de planilla obtenida exitosamente' })
  findAllPlanillaDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlanillaDet(empresaId);
  }

  @Get('planilla-det/:id')
  @ApiOperation({ summary: 'Obtener detalle de planilla por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de planilla encontrado' })
  @ApiResponse({ status: 404, description: 'Detalle de planilla no encontrado' })
  findPlanillaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlanillaDet(id, empresaId);
  }

  @Post('planilla-det')
  @ApiOperation({ summary: 'Crear detalle de planilla' })
  @ApiResponse({ status: 201, description: 'Detalle de planilla creado exitosamente' })
  createPlanillaDet(@Body() dto: CreatePlPlaDetDto, @CurrentUser() user: any) {
    return this.service.createPlanillaDet(dto, user.usuario);
  }

  @Put('planilla-det/:id')
  @ApiOperation({ summary: 'Actualizar detalle de planilla' })
  @ApiResponse({ status: 200, description: 'Detalle de planilla actualizado exitosamente' })
  updatePlanillaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePlPlaDetDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlanillaDet(id, empresaId, dto, user.usuario);
  }

  @Get('puestos')
  @ApiOperation({ summary: 'Listar puestos' })
  @ApiResponse({ status: 200, description: 'Lista de puestos obtenida exitosamente' })
  findAllPuestos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPuestos(empresaId);
  }

  @Get('deptos')
  @ApiOperation({ summary: 'Listar departamentos de planilla (tpldeptos)' })
  @ApiResponse({ status: 200, description: 'Lista de departamentos obtenida exitosamente' })
  findAllDeptos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDeptos(empresaId);
  }

  @Get('tmeses')
  @ApiOperation({ summary: 'Listar meses del año (tmeses)' })
  @ApiResponse({ status: 200, description: 'Lista de meses obtenida exitosamente' })
  findMeses() {
    return this.service.findMeses();
  }

  @Get('puestos/:id')
  @ApiOperation({ summary: 'Obtener puesto por ID' })
  @ApiResponse({ status: 200, description: 'Puesto encontrado' })
  @ApiResponse({ status: 404, description: 'Puesto no encontrado' })
  findPuesto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPuesto(id, empresaId);
  }

  @Post('puestos')
  @ApiOperation({ summary: 'Crear puesto' })
  @ApiResponse({ status: 201, description: 'Puesto creado exitosamente' })
  createPuesto(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPuesto(dto, user.usuario);
  }

  @Put('puestos/:id')
  @ApiOperation({ summary: 'Actualizar puesto' })
  @ApiResponse({ status: 200, description: 'Puesto actualizado exitosamente' })
  updatePuesto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePuesto(id, empresaId, dto, user.usuario);
  }

  @Get('profesiones')
  @ApiOperation({ summary: 'Listar profesiones' })
  @ApiResponse({ status: 200, description: 'Lista de profesiones obtenida exitosamente' })
  findAllProfesiones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProfesiones(empresaId);
  }

  @Get('profesiones/:id')
  @ApiOperation({ summary: 'Obtener profesión por ID' })
  @ApiResponse({ status: 200, description: 'Profesión encontrada' })
  @ApiResponse({ status: 404, description: 'Profesión no encontrada' })
  findProfesion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProfesion(id, empresaId);
  }

  @Post('profesiones')
  @ApiOperation({ summary: 'Crear profesión' })
  @ApiResponse({ status: 201, description: 'Profesión creada exitosamente' })
  createProfesion(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createProfesion(dto, user.usuario);
  }

  @Put('profesiones/:id')
  @ApiOperation({ summary: 'Actualizar profesión' })
  @ApiResponse({ status: 200, description: 'Profesión actualizada exitosamente' })
  updateProfesion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProfesion(id, empresaId, dto, user.usuario);
  }

  @Get('tipo-empleado')
  @ApiOperation({ summary: 'Listar tipos de empleado' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de empleado obtenida exitosamente' })
  findAllTipoEmpleado(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTipoEmpleado(empresaId);
  }

  @Get('tipo-empleado/:id')
  @ApiOperation({ summary: 'Obtener tipo de empleado por ID' })
  @ApiResponse({ status: 200, description: 'Tipo de empleado encontrado' })
  @ApiResponse({ status: 404, description: 'Tipo de empleado no encontrado' })
  findTipoEmpleado(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTipoEmpleado(id, empresaId);
  }

  @Post('tipo-empleado')
  @ApiOperation({ summary: 'Crear tipo de empleado' })
  @ApiResponse({ status: 201, description: 'Tipo de empleado creado exitosamente' })
  createTipoEmpleado(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createTipoEmpleado(dto, user.usuario);
  }

  @Put('tipo-empleado/:id')
  @ApiOperation({ summary: 'Actualizar tipo de empleado' })
  @ApiResponse({ status: 200, description: 'Tipo de empleado actualizado exitosamente' })
  updateTipoEmpleado(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTipoEmpleado(id, empresaId, dto, user.usuario);
  }

  @Delete('tipo-empleado/:id')
  @ApiOperation({ summary: 'Eliminar tipo de empleado' })
  @ApiResponse({ status: 200, description: 'Tipo de empleado eliminado exitosamente' })
  removeTipoEmpleado(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeTipoEmpleado(id, empresaId);
  }

  @Get('tipo-mov')
  @ApiOperation({ summary: 'Listar tipos de movimiento' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de movimiento obtenida exitosamente' })
  findAllTipoMov(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTipoMov(empresaId);
  }

  @Get('tipo-mov/:id')
  @ApiOperation({ summary: 'Obtener tipo de movimiento por ID' })
  @ApiResponse({ status: 200, description: 'Tipo de movimiento encontrado' })
  @ApiResponse({ status: 404, description: 'Tipo de movimiento no encontrado' })
  findTipoMov(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTipoMov(id, empresaId);
  }

  @Post('tipo-mov')
  @ApiOperation({ summary: 'Crear tipo de movimiento' })
  @ApiResponse({ status: 201, description: 'Tipo de movimiento creado exitosamente' })
  createTipoMov(@Body() dto: CreateTplTipoMovDto, @CurrentUser() user: any) {
    return this.service.createTipoMov(dto, user.usuario);
  }

  @Put('tipo-mov/:id')
  @ApiOperation({ summary: 'Actualizar tipo de movimiento' })
  @ApiResponse({ status: 200, description: 'Tipo de movimiento actualizado exitosamente' })
  updateTipoMov(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateTplTipoMovDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTipoMov(id, empresaId, dto, user.usuario);
  }

  @Delete('tipo-mov/:id')
  @ApiOperation({ summary: 'Eliminar tipo de movimiento' })
  @ApiResponse({ status: 200, description: 'Tipo de movimiento eliminado exitosamente' })
  removeTipoMov(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeTipoMov(id, empresaId);
  }

  @Get('empleado-tipo-mov')
  @ApiOperation({ summary: 'Listar tipos de movimiento por empleado' })
  @ApiResponse({ status: 200, description: 'Lista obtenida exitosamente' })
  findAllPlTipoMov(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('empleadoId') empleadoId?: string,
  ) {
    return this.service.findAllPlTipoMov(empresaId, empleadoId ? Number(empleadoId) : undefined);
  }

  @Get('empleado-tipo-mov/:id')
  @ApiOperation({ summary: 'Obtener tipo de movimiento de empleado por ID' })
  @ApiResponse({ status: 200, description: 'Encontrado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  findPlTipoMov(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlTipoMov(id, empresaId);
  }

  @Post('empleado-tipo-mov')
  @ApiOperation({ summary: 'Crear tipo de movimiento de empleado' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createPlTipoMov(@Body() dto: CreatePlTipoMovDto, @CurrentUser() user: any) {
    return this.service.createPlTipoMov(dto, user.usuario);
  }

  @Post('empleado-tipo-mov/derechos-laborales')
  @ApiOperation({
    summary: 'Dar derechos laborales (proceso por lotes desde tpltipomov)',
    description:
      'Registra en pletipomov los tipos de movimiento de tpltipomov con sn_obligatoria=' +
      'S para el empleado indicado. Los que ya existen se actualizan.',
  })
  @ApiResponse({ status: 201, description: 'Lote aplicado con detalle de creados/actualizados' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  darDerechosLaborales(@Body() dto: DarDerechosLaboralesDto, @CurrentUser() user: any) {
    return this.service.darDerechosLaborales(dto.empleadoId, dto.empresaId, user.usuario);
  }

  @Get('retenciones/revisacion')
  @ApiOperation({
    summary: 'Revisión de retenciones (ISR e Impuesto Vecinal) por empleado',
    description:
      'ISR: tabla progresiva tcoisr (tasa en %) sobre el ingreso anual = sueldobruto × meses ' +
      'desde fecha_alta hasta fecha de sistema (año calendario).\n' +
      'Vecinal: tabla progresiva tcoimpuestovecinal (tasa por cada L 1,000) con la misma base ' +
      'de ingreso pero ventana fiscal 1 junio → 31 de mayo.\n' +
      'Compara ambos contra la fila registrada en pletipomov.',
  })
  @ApiResponse({ status: 200, description: 'Tramos, cálculo por empleado y totales' })
  revisarRetenciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.revisarRetenciones(empresaId);
  }

  @Get('ingresos-rev/revisar')
  @ApiOperation({
    summary: 'Resumen de ingresos por empleado',
    description:
      'Comisiones sobre ventas, pago de horas extras, pago doble por días festivos, ' +
      'decimo tercer mes y decimo cuarto mes.\n' +
      'Los tres primeros se resumen desde lo registrado en pletipomov (no tienen fuente ' +
      'de datos propia). Los décimos se calculan como salario ordinario del año / 12 y se ' +
      'comparan contra lo registrado para detectar descuadres.',
  })
  @ApiResponse({ status: 200, description: 'Columnas, cálculo por empleado y totales' })
  revisarIngresos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.revisarIngresos(empresaId);
  }

  @Put('empleado-tipo-mov/:id')
  @ApiOperation({ summary: 'Actualizar tipo de movimiento de empleado' })
  @ApiResponse({ status: 200, description: 'Actualizado exitosamente' })
  updatePlTipoMov(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePlTipoMovDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlTipoMov(id, empresaId, dto, user.usuario);
  }

  @Delete('empleado-tipo-mov/:id')
  @ApiOperation({ summary: 'Eliminar tipo de movimiento de empleado' })
  @ApiResponse({ status: 200, description: 'Eliminado exitosamente' })
  removePlTipoMov(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePlTipoMov(id, empresaId);
  }

  @Get('ingresos')
  @ApiOperation({ summary: 'Listar ingresos' })
  @ApiResponse({ status: 200, description: 'Lista de ingresos obtenida exitosamente' })
  findAllIngresos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllIngresos(empresaId);
  }

  @Get('ingresos/:id')
  @ApiOperation({ summary: 'Obtener ingreso por ID' })
  @ApiResponse({ status: 200, description: 'Ingreso encontrado' })
  @ApiResponse({ status: 404, description: 'Ingreso no encontrado' })
  findIngreso(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findIngreso(id, empresaId);
  }

  @Post('ingresos')
  @ApiOperation({ summary: 'Crear ingreso' })
  @ApiResponse({ status: 201, description: 'Ingreso creado exitosamente' })
  createIngreso(@Body() dto: CreateTplIngresosDto, @CurrentUser() user: any) {
    return this.service.createIngreso(dto, user.usuario);
  }

  @Put('ingresos/:id')
  @ApiOperation({ summary: 'Actualizar ingreso' })
  @ApiResponse({ status: 200, description: 'Ingreso actualizado exitosamente' })
  updateIngreso(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateTplIngresosDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateIngreso(id, empresaId, dto, user.usuario);
  }
}
