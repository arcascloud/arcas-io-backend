import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlanillaService } from './planilla.service';
import { CreatePlEmpleadosDto, UpdatePlEmpleadosDto } from './dto/plplempleados.dto';
import { CreatePlPlaMaeDto, UpdatePlPlaMaeDto } from './dto/pleplamae.dto';
import { CreatePlPlaDetDto, UpdatePlPlaDetDto } from './dto/plepladet.dto';
import { CreateTplDeduccionesDto, UpdateTplDeduccionesDto } from './dto/tpldeducciones.dto';
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

  @Get('comisiones')
  @ApiOperation({ summary: 'Listar comisiones' })
  @ApiResponse({ status: 200, description: 'Lista de comisiones obtenida exitosamente' })
  findAllComisiones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllComisiones(empresaId);
  }

  @Get('comisiones/:id')
  @ApiOperation({ summary: 'Obtener comisión por ID' })
  @ApiResponse({ status: 200, description: 'Comisión encontrada' })
  @ApiResponse({ status: 404, description: 'Comisión no encontrada' })
  findComision(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findComision(id, empresaId);
  }

  @Post('comisiones')
  @ApiOperation({ summary: 'Crear comisión' })
  @ApiResponse({ status: 201, description: 'Comisión creada exitosamente' })
  createComision(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createComision(dto, user.usuario);
  }

  @Put('comisiones/:id')
  @ApiOperation({ summary: 'Actualizar comisión' })
  @ApiResponse({ status: 200, description: 'Comisión actualizada exitosamente' })
  updateComision(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateComision(id, empresaId, dto, user.usuario);
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

  @Get('deducciones')
  @ApiOperation({ summary: 'Listar deducciones' })
  @ApiResponse({ status: 200, description: 'Lista de deducciones obtenida exitosamente' })
  findAllDeducciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDeducciones(empresaId);
  }

  @Get('deducciones/:id')
  @ApiOperation({ summary: 'Obtener deducción por ID' })
  @ApiResponse({ status: 200, description: 'Deducción encontrada' })
  @ApiResponse({ status: 404, description: 'Deducción no encontrada' })
  findDeduccion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDeduccion(id, empresaId);
  }

  @Post('deducciones')
  @ApiOperation({ summary: 'Crear deducción' })
  @ApiResponse({ status: 201, description: 'Deducción creada exitosamente' })
  createDeduccion(@Body() dto: CreateTplDeduccionesDto, @CurrentUser() user: any) {
    return this.service.createDeduccion(dto, user.usuario);
  }

  @Put('deducciones/:id')
  @ApiOperation({ summary: 'Actualizar deducción' })
  @ApiResponse({ status: 200, description: 'Deducción actualizada exitosamente' })
  updateDeduccion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateTplDeduccionesDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDeduccion(id, empresaId, dto, user.usuario);
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
