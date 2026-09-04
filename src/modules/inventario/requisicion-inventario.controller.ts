import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequisicionInventarioService } from './requisicion-inventario.service';

@ApiTags('Inventario - Requisiciones')
@ApiBearerAuth()
@Controller('inventario/requisiciones')
export class RequisicionInventarioController {
  constructor(private readonly service: RequisicionInventarioService) {}

  @Get()
  @ApiOperation({ summary: 'Listar requisiciones' })
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMae(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener requisición por ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOneMae(id, empresaId);
  }

  @Get(':id/det')
  @ApiOperation({ summary: 'Obtener items de la requisición' })
  findDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDetByMae(id, empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear requisición' })
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createMae({ ...dto, empresaId: dto.empresaId || 2 }, user?.usuario || 'admin');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar requisición' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMae(id, empresaId, dto, user?.usuario || 'admin');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar requisición' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeMae(id, empresaId);
  }

  @Post('det')
  @ApiOperation({ summary: 'Agregar item a la requisición' })
  createDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDet({ ...dto, empresaId: dto.empresaId || 2 }, user?.usuario || 'admin');
  }

  @Put('det/:id')
  @ApiOperation({ summary: 'Actualizar item de la requisición' })
  updateDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDet(id, empresaId, dto, user?.usuario || 'admin');
  }

  @Delete('det/:id')
  @ApiOperation({ summary: 'Eliminar item de la requisición' })
  removeDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeDet(id, empresaId);
  }

  @Post(':id/procesar')
  @ApiOperation({ summary: 'Procesar requisición (aprobar)' })
  procesar(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.procesar(id, empresaId, user?.usuario || 'admin');
  }

  @Post(':id/anular')
  @ApiOperation({ summary: 'Anular requisición' })
  anular(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.anular(id, empresaId, user?.usuario || 'admin');
  }
}
