import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TrasladoInventarioService } from './traslado-inventario.service';

@ApiTags('Inventario - Traslados')
@ApiBearerAuth()
@Controller('inventario/traslados-mae')
export class TrasladoInventarioController {
  constructor(private readonly service: TrasladoInventarioService) {}

  @Get()
  @ApiOperation({ summary: 'Listar traslados' })
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMae(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener traslado por ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOneMae(id, empresaId);
  }

  @Get(':id/det')
  @ApiOperation({ summary: 'Obtener items del traslado' })
  findDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDetByMae(id, empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear traslado' })
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createMae({ ...dto, empresaId: dto.empresaId || 2 }, user?.usuario || 'admin');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar traslado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMae(id, empresaId, dto, user?.usuario || 'admin');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar traslado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeMae(id, empresaId);
  }

  @Post('det')
  @ApiOperation({ summary: 'Agregar item al traslado' })
  createDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDet({ ...dto, empresaId: dto.empresaId || 2 }, user?.usuario || 'admin');
  }

  @Delete('det/:id')
  @ApiOperation({ summary: 'Eliminar item del traslado' })
  removeDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeDet(id, empresaId);
  }

  @Post(':id/procesar')
  @ApiOperation({ summary: 'Procesar traslado (kardex salida + entrada)' })
  procesar(
    @Param('id', ParseIntPipe) id: number,
    @Body('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.procesar(id, empresaId, user?.usuario || 'admin');
  }

  @Post(':id/anular')
  @ApiOperation({ summary: 'Anular traslado' })
  anular(
    @Param('id', ParseIntPipe) id: number,
    @Body('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.anular(id, empresaId, user?.usuario || 'admin');
  }
}
