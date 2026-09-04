import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SucursalesService } from './sucursales.service';
import { CreateSucursalDto, UpdateSucursalDto } from './dto/sucursal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Sucursales')
@ApiBearerAuth()
@Controller('sucursales')
@UseGuards(JwtAuthGuard)
export class SucursalesController {
  constructor(private readonly service: SucursalesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar sucursales' })
  @ApiResponse({ status: 200, description: 'Lista de sucursales obtenida exitosamente' })
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAll(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener sucursal por ID' })
  @ApiResponse({ status: 200, description: 'Sucursal encontrada' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOne(id, empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear sucursal' })
  @ApiResponse({ status: 201, description: 'Sucursal creada exitosamente' })
  create(@Body() dto: CreateSucursalDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.usuario);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar sucursal' })
  @ApiResponse({ status: 200, description: 'Sucursal actualizada exitosamente' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSucursalDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, empresaId, dto, user.usuario);
  }
}
