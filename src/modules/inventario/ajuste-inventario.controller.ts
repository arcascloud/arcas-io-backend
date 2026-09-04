import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AjusteInventarioService } from './ajuste-inventario.service';

@ApiTags('Inventario - Ajuste de Inventario')
@ApiBearerAuth()
@Controller('inventario/ajustes-inventario')
export class AjusteInventarioController {
  constructor(private readonly service: AjusteInventarioService) {}

  @Get()
  @ApiOperation({ summary: 'Listar ajustes de inventario' })
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMae(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ajuste por ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOneMae(id, empresaId);
  }

  @Get(':id/det')
  @ApiOperation({ summary: 'Obtener items del ajuste' })
  findDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDetByMae(id, empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear ajuste de inventario' })
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createMae({ ...dto, empresaId: dto.empresaId || 2 }, user?.usuario || 'admin');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar ajuste' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMae(id, empresaId, dto, user?.usuario || 'admin');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar ajuste' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeMae(id, empresaId);
  }

  @Post('det')
  @ApiOperation({ summary: 'Agregar item al ajuste' })
  createDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDet({ ...dto, empresaId: dto.empresaId || 2 }, user?.usuario || 'admin');
  }

  @Put('det/:id')
  @ApiOperation({ summary: 'Actualizar item del ajuste' })
  updateDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDet(id, empresaId, dto, user?.usuario || 'admin');
  }

  @Delete('det/:id')
  @ApiOperation({ summary: 'Eliminar item del ajuste' })
  removeDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeDet(id, empresaId);
  }

  @Post(':id/procesar')
  @ApiOperation({ summary: 'Procesar ajuste (aplica kardex y existencias)' })
  procesar(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.procesar(id, empresaId, user?.usuario || 'admin');
  }
}
