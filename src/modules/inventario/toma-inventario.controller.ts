import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TomaInventarioService } from './toma-inventario.service';

@ApiTags('Inventario - Toma de Inventario')
@ApiBearerAuth()
@Controller('inventario/toma-inventario')
export class TomaInventarioController {
  constructor(private readonly service: TomaInventarioService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tomas de inventario' })
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMae(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener toma de inventario por ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOneMae(id, empresaId);
  }

  @Get(':id/det')
  @ApiOperation({ summary: 'Obtener items de la toma de inventario' })
  findDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDetByMae(id, empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear toma de inventario' })
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createMae({ ...dto, empresaId: dto.empresaId || 2 }, user?.usuario || 'admin');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar toma de inventario' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMae(id, empresaId, dto, user?.usuario || 'admin');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar toma de inventario' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeMae(id, empresaId);
  }

  @Post('det')
  @ApiOperation({ summary: 'Agregar item a la toma de inventario' })
  createDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDet({ ...dto, empresaId: dto.empresaId || 2 }, user?.usuario || 'admin');
  }

  @Put('det/:id')
  @ApiOperation({ summary: 'Actualizar item de toma de inventario' })
  updateDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDet(id, empresaId, dto, user?.usuario || 'admin');
  }

  @Delete('det/:id')
  @ApiOperation({ summary: 'Eliminar item de toma de inventario' })
  removeDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeDet(id, empresaId);
  }

  @Post(':id/procesar')
  @ApiOperation({ summary: 'Procesar toma de inventario (aplica ajustes)' })
  procesar(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body('bodegaId', ParseIntPipe) bodegaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.procesarInventario(id, empresaId, bodegaId, user?.usuario || 'admin');
  }

  @Post('det/:id/cargar-existencia')
  @ApiOperation({ summary: 'Cargar existencia del sistema para un item' })
  cargarExistencia(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.cargarExistencia(id, empresaId);
  }

  @Post('importar/:id')
  @ApiOperation({ summary: 'Importar items desde archivo (CSV, Excel, JSON, XML)' })
  importar(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body('items') items: any[],
    @CurrentUser() user: any,
  ) {
    return this.service.importarItems(id, empresaId, items, user?.usuario || 'admin');
  }
}
