import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateEmpresaDto, UpdateEmpresaDto } from './dto/empresa.dto';
import { CreateEmpresaDetDto, UpdateEmpresaDetDto } from './dto/empresasdet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Empresas')
@ApiBearerAuth()
@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar empresas' })
  @ApiResponse({ status: 200, description: 'Lista de empresas obtenida exitosamente' })
  findAll() {
    return this.service.findAll();
  }

  @Get('det')
  @ApiOperation({ summary: 'Listar datos de empresa (RTN, tel, dir, etc)' })
  @ApiResponse({ status: 200, description: 'Datos de empresa obtenidos' })
  findAllDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDet(empresaId);
  }

  @Get('det/:id')
  @ApiOperation({ summary: 'Obtener dato de empresa por ID' })
  findOneDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOneDet(id, empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener empresa por ID' })
  @ApiResponse({ status: 200, description: 'Empresa encontrada' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear empresa' })
  @ApiResponse({ status: 201, description: 'Empresa creada exitosamente' })
  create(@Body() dto: CreateEmpresaDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.usuario);
  }

  @Post('det')
  @ApiOperation({ summary: 'Crear dato de empresa' })
  @ApiResponse({ status: 201, description: 'Dato de empresa creado' })
  createDet(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: CreateEmpresaDetDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createDet(empresaId, dto, user.usuario);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar empresa' })
  @ApiResponse({ status: 200, description: 'Empresa actualizada exitosamente' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmpresaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.usuario);
  }

  @Put('det/:id')
  @ApiOperation({ summary: 'Actualizar dato de empresa' })
  @ApiResponse({ status: 200, description: 'Dato de empresa actualizado' })
  updateDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateEmpresaDetDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDet(id, empresaId, dto, user.usuario);
  }


}

