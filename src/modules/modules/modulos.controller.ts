import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ModulosService } from './modulos.service';
import { CreateModuloDto, UpdateModuloDto } from './dto/modulo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Módulos')
@ApiBearerAuth()
@Controller('modulos')
@UseGuards(JwtAuthGuard)
export class ModulosController {
  constructor(private readonly service: ModulosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar módulos' })
  @ApiResponse({ status: 200, description: 'Lista de módulos obtenida exitosamente' })
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAll(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener módulo por ID' })
  @ApiResponse({ status: 200, description: 'Módulo encontrado' })
  @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOne(id, empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear módulo' })
  @ApiResponse({ status: 201, description: 'Módulo creado exitosamente' })
  create(@Body() dto: CreateModuloDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.usuario);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar módulo' })
  @ApiResponse({ status: 200, description: 'Módulo actualizado exitosamente' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateModuloDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, empresaId, dto, user.usuario);
  }
}
