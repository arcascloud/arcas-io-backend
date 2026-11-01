import {
  Controller, Get, Post, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TrasaviblidadService } from './trasaviblidad.service';
import { CreateTrasaviblidadDto, BulkTrasaviblidadDto } from './dto/trasaviblidad.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Trasaviblidad')
@ApiBearerAuth()
@Controller('contabilidad/trasaviblidad')
@UseGuards(JwtAuthGuard)
export class TrasaviblidadController {
  constructor(private readonly service: TrasaviblidadService) {}

  // ===== Catálogo =====

  @Get('tablas')
  @ApiOperation({ summary: 'Tablas transaccionales trazables y su módulo' })
  findTablas() {
    return this.service.findTablas();
  }

  // ===== Trazas (deben declararse antes de ':id') =====

  @Get('partida/:partidaId')
  @ApiOperation({ summary: 'Documentos maestros integrados en una partida contable' })
  @ApiResponse({ status: 200, description: 'Lista de registros maestros de la partida' })
  porPartida(
    @Param('partidaId', ParseIntPipe) partidaId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.porPartida(partidaId, empresaId);
  }

  @Get('referencia/:moduloId/:referenciaId')
  @ApiOperation({ summary: 'Traza de un documento maestro: partida contable a la que quedó integrado' })
  porReferencia(
    @Param('moduloId', ParseIntPipe) moduloId: number,
    @Param('referenciaId', ParseIntPipe) referenciaId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.porReferencia(moduloId, referenciaId, empresaId);
  }

  // ===== CRUD =====

  @Get()
  @ApiOperation({ summary: 'Listar trazabilidades (filtros opcionales: moduloId, partidaId, referenciaId, limit)' })
  findAll(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('moduloId') moduloId?: string,
    @Query('partidaId') partidaId?: string,
    @Query('referenciaId') referenciaId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(empresaId, {
      moduloId: moduloId != null && moduloId !== '' ? Number(moduloId) : undefined,
      partidaId: partidaId != null && partidaId !== '' ? Number(partidaId) : undefined,
      referenciaId: referenciaId != null && referenciaId !== '' ? Number(referenciaId) : undefined,
      limit: limit != null && limit !== '' ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una trazabilidad por ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOne(id, empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar la trazabilidad de un documento maestro (idempotente)' })
  @ApiResponse({ status: 201, description: 'Trazabilidad registrada' })
  create(@Body() dto: CreateTrasaviblidadDto, @CurrentUser() user: any) {
    return this.service.create(dto, user?.usuario);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Registrar múltiples trazabilidades' })
  createBulk(@Body() dto: BulkTrasaviblidadDto, @CurrentUser() user: any) {
    return this.service.createBulk(dto, user?.usuario);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una trazabilidad' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.remove(id, empresaId);
  }
}
