import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SucursalesService } from './sucursales.service';
import { CreateSucursalDto, UpdateSucursalDto } from './dto/sucursal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/** Query param opcional: ParseIntPipe rompe cuando no viene (o viene vacío) */
function parseEmpresaId(empresaId?: string): number | undefined {
  return empresaId != null && empresaId !== '' ? Number(empresaId) : undefined;
}

@ApiTags('Sucursales')
@ApiBearerAuth()
@Controller('sucursales')
@UseGuards(JwtAuthGuard)
export class SucursalesController {
  constructor(private readonly service: SucursalesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar sucursales (empresaId opcional: sin él lista todas las empresas)' })
  @ApiResponse({ status: 200, description: 'Lista de sucursales obtenida exitosamente' })
  findAll(@Query('empresaId') empresaId?: string) {
    return this.service.findAll(parseEmpresaId(empresaId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener sucursal por ID (empresaId opcional)' })
  @ApiResponse({ status: 200, description: 'Sucursal encontrada' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId') empresaId?: string,
  ) {
    return this.service.findOne(id, parseEmpresaId(empresaId));
  }

  @Post()
  @ApiOperation({ summary: 'Crear sucursal (crea automáticamente su bodega por defecto)' })
  @ApiResponse({ status: 201, description: 'Sucursal creada exitosamente' })
  create(@Body() dto: CreateSucursalDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.usuario);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar sucursal (empresaId opcional)' })
  @ApiResponse({ status: 200, description: 'Sucursal actualizada exitosamente' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId') empresaId: string | undefined,
    @Body() dto: UpdateSucursalDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(
      id,
      parseEmpresaId(empresaId),
      dto,
      user.usuario,
      user.empresaId,
    );
  }
}
