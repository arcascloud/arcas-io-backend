import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FecService } from './fec.service';
import {
  CreateFecmaDto, UpdateFecmaDto, CreateFecdetDto, UpdateFecdetDto,
  UpdateFechaSistemaDto,
} from './dto/fec.dto';

@ApiTags('Fechas Autorizadas')
@ApiBearerAuth()
@Controller('parametros')
@UseGuards(JwtAuthGuard)
export class FecController {
  constructor(private readonly service: FecService) {}

  // ══════════════════════ Fecha del Sistema del ERP ══════════════════════

  @Get('fechas-sistema')
  @ApiOperation({
    summary: 'Estado de la Fecha del Sistema del ERP vs la del servidor',
    description:
      'Compara tempresas.fechasistema con CURDATE() de MySQL. Si no coinciden, ' +
      'el backend bloquea toda escritura (409 FECHA_SISTEMA), salvo usuarios con ' +
      'rango vigente en tfecdet.',
  })
  @ApiResponse({ status: 200, description: 'Estado de la fecha' })
  getEstadoFechaSistema(
    @Query('empresaId') empresaId: string | undefined,
    @CurrentUser() user: any,
  ) {
    const eid = empresaId ? Number(empresaId) : user?.empresaId;
    return this.service.getEstadoFechaSistema(eid);
  }

  @Put('fechas-sistema')
  @ApiOperation({
    summary: 'Actualizar la Fecha del Sistema del ERP',
    description:
      'Restringido a los roles admin / supervisor / contador. Es la única ' +
      'escritura exenta del bloqueo por fecha desalineada.',
  })
  @ApiResponse({ status: 200, description: 'Fecha actualizada' })
  actualizarFechaSistema(
    @Body() dto: UpdateFechaSistemaDto,
    @Query('empresaId') empresaId: string | undefined,
    @CurrentUser() user: any,
  ) {
    const eid = empresaId ? Number(empresaId) : user?.empresaId;
    return this.service.actualizarFechaSistema(dto.fechasistema, user.usuario, eid);
  }

  // ══════════════════════ Regla de negocio (lectura) ══════════════════════

  @Get('fechas/autorizar')
  @ApiOperation({
    summary: '¿Puede el usuario registrar datos en una fecha (período cerrado)?',
    description:
      'Devuelve autorizado=true si la fecha cae dentro del rango de un maestro de la ' +
      'empresa y el usuario está en su detalle con sn_permitido=S.',
  })
  @ApiResponse({ status: 200, description: 'Resultado del chequeo' })
  @ApiQuery({ name: 'usuario', required: true, description: 'Login del usuario' })
  @ApiQuery({ name: 'fecha', required: false, description: 'Fecha a validar (YYYY-MM-DD)' })
  @ApiQuery({ name: 'empresaId', required: false, description: 'Empresa' })
  autorizar(
    @Query('usuario') usuario: string,
    @Query('fecha') fecha: string | undefined,
    @Query('empresaId') empresaId: string | undefined,
    @CurrentUser() user: any,
  ) {
    const eid = empresaId ? Number(empresaId) : user?.empresaId;
    return this.service.autorizar(usuario, eid, fecha);
  }

  // ══════════════════════ Maestro (tfecma) ══════════════════════

  @Get('fechas')
  @ApiOperation({ summary: 'Listar maestros de fechas autorizadas con su detalle' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  @ApiQuery({ name: 'empresaId', required: false, description: 'Empresa' })
  findAllFecma(
    @Query('empresaId') empresaId: string | undefined,
    @CurrentUser() user: any,
  ) {
    const eid = empresaId ? Number(empresaId) : user?.empresaId;
    return this.service.findAllFecma(eid);
  }

  @Get('fechas/:id')
  @ApiOperation({ summary: 'Obtener maestro de fechas autorizadas con detalle' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  @ApiQuery({ name: 'empresaId', required: false, description: 'Empresa' })
  findFecma(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId') empresaId: string | undefined,
    @CurrentUser() user: any,
  ) {
    const eid = empresaId ? Number(empresaId) : user?.empresaId;
    return this.service.findFecma(id, eid);
  }

  @Post('fechas')
  @ApiOperation({
    summary: 'Crear maestro de fechas autorizadas con detalle (transaccional)',
    description: 'Maestro y detalle se insertan en UNA transacción; si algo falla no se persiste nada.',
  })
  @ApiResponse({ status: 201, description: 'Creado' })
  createFecma(@Body() dto: CreateFecmaDto, @CurrentUser() user: any) {
    const eid = dto.empresaId ?? user?.empresaId;
    return this.service.createFecma(dto, user.usuario, eid);
  }

  @Put('fechas/:id')
  @ApiOperation({
    summary: 'Actualizar maestro de fechas autorizadas con detalle (transaccional)',
    description: 'Si el body incluye "detalles" se reemplaza la línea completa en transacción.',
  })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateFecma(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFecmaDto,
    @CurrentUser() user: any,
  ) {
    const eid = dto.empresaId ?? user?.empresaId;
    return this.service.updateFecma(id, dto, user.usuario, eid);
  }

  @Delete('fechas/:id')
  @ApiOperation({ summary: 'Eliminar maestro de fechas autorizadas (cascada al detalle)' })
  @ApiResponse({ status: 200, description: 'Eliminado' })
  @ApiQuery({ name: 'empresaId', required: false, description: 'Empresa' })
  removeFecma(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId') empresaId: string | undefined,
    @CurrentUser() user: any,
  ) {
    const eid = empresaId ? Number(empresaId) : user?.empresaId;
    return this.service.removeFecma(id, user.usuario, eid);
  }

  // ══════════════════════ Detalle (tfecdet) ══════════════════════

  @Get('fechas-det')
  @ApiOperation({ summary: 'Listar líneas de detalle de fechas autorizadas' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  @ApiQuery({ name: 'empresaId', required: false, description: 'Empresa' })
  @ApiQuery({ name: 'fecmaeId', required: false, description: 'Filtrar por maestro' })
  findAllFecdet(
    @Query('empresaId') empresaId: string | undefined,
    @Query('fecmaeId') fecmaeId: string | undefined,
    @CurrentUser() user: any,
  ) {
    const eid = empresaId ? Number(empresaId) : user?.empresaId;
    const mae = fecmaeId ? Number(fecmaeId) : undefined;
    return this.service.findAllFecdet(eid, mae);
  }

  @Get('fechas-det/:id')
  @ApiOperation({ summary: 'Obtener línea de detalle de fechas autorizadas' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  @ApiQuery({ name: 'empresaId', required: false, description: 'Empresa' })
  findFecdet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId') empresaId: string | undefined,
    @CurrentUser() user: any,
  ) {
    const eid = empresaId ? Number(empresaId) : user?.empresaId;
    return this.service.findFecdet(id, eid);
  }

  @Post('fechas-det')
  @ApiOperation({ summary: 'Agregar usuario a un maestro de fechas autorizadas' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createFecdet(@Body() dto: CreateFecdetDto, @CurrentUser() user: any) {
    const eid = dto.empresaId ?? user?.empresaId;
    return this.service.createFecdet(dto, user.usuario, eid);
  }

  @Put('fechas-det/:id')
  @ApiOperation({ summary: 'Actualizar línea de detalle de fechas autorizadas' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateFecdet(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFecdetDto,
    @CurrentUser() user: any,
  ) {
    const eid = dto.empresaId ?? user?.empresaId;
    return this.service.updateFecdet(id, dto, user.usuario, eid);
  }

  @Delete('fechas-det/:id')
  @ApiOperation({ summary: 'Eliminar línea de detalle de fechas autorizadas' })
  @ApiResponse({ status: 200, description: 'Eliminado' })
  @ApiQuery({ name: 'empresaId', required: false, description: 'Empresa' })
  removeFecdet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId') empresaId: string | undefined,
    @CurrentUser() user: any,
  ) {
    const eid = empresaId ? Number(empresaId) : user?.empresaId;
    return this.service.removeFecdet(id, user.usuario, eid);
  }
}
