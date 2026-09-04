import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BancosService } from './bancos.service';
import { CreateBancoDto, UpdateBancoDto, CreateBcoCtaDto, UpdateBcoCtaDto } from './dto/banco.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Bancos')
@ApiBearerAuth()
@Controller('bancos')
@UseGuards(JwtAuthGuard)
export class BancosController {
  constructor(private readonly service: BancosService) {}

  @Get('bancos')
  @ApiOperation({ summary: 'Listar bancos' })
  @ApiResponse({ status: 200, description: 'Lista de bancos obtenida exitosamente' })
  findAllBancos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllBancos(empresaId);
  }

  @Get('bancos/:id')
  @ApiOperation({ summary: 'Obtener banco por ID' })
  @ApiResponse({ status: 200, description: 'Banco encontrado' })
  @ApiResponse({ status: 404, description: 'Banco no encontrado' })
  findBanco(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findBanco(id, empresaId);
  }

  @Post('bancos')
  @ApiOperation({ summary: 'Crear banco' })
  @ApiResponse({ status: 201, description: 'Banco creado exitosamente' })
  createBanco(@Body() dto: CreateBancoDto, @CurrentUser() user: any) {
    return this.service.createBanco(dto, user.usuario);
  }

  @Put('bancos/:id')
  @ApiOperation({ summary: 'Actualizar banco' })
  @ApiResponse({ status: 200, description: 'Banco actualizado exitosamente' })
  updateBanco(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateBancoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateBanco(id, empresaId, dto, user.usuario);
  }

  @Get('cuentas')
  @ApiOperation({ summary: 'Listar cuentas bancarias' })
  @ApiResponse({ status: 200, description: 'Lista de cuentas bancarias obtenida exitosamente' })
  findAllCtas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCtas(empresaId);
  }

  @Get('cuentas/:id')
  @ApiOperation({ summary: 'Obtener cuenta bancaria por ID' })
  @ApiResponse({ status: 200, description: 'Cuenta bancaria encontrada' })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada' })
  findCta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCta(id, empresaId);
  }

  @Post('cuentas')
  @ApiOperation({ summary: 'Crear cuenta bancaria' })
  @ApiResponse({ status: 201, description: 'Cuenta bancaria creada exitosamente' })
  createCta(@Body() dto: CreateBcoCtaDto, @CurrentUser() user: any) {
    return this.service.createCta(dto, user.usuario);
  }

  @Put('cuentas/:id')
  @ApiOperation({ summary: 'Actualizar cuenta bancaria' })
  @ApiResponse({ status: 200, description: 'Cuenta bancaria actualizada exitosamente' })
  updateCta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateBcoCtaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCta(id, empresaId, dto, user.usuario);
  }

  @Get('conciliaciones')
  @ApiOperation({ summary: 'Listar conciliaciones bancarias' })
  @ApiResponse({ status: 200, description: 'Lista de conciliaciones bancarias obtenida exitosamente' })
  findAllConciliaciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllConciliaciones(empresaId);
  }

  @Get('conciliaciones/:id')
  @ApiOperation({ summary: 'Obtener conciliación bancaria por ID' })
  @ApiResponse({ status: 200, description: 'Conciliación bancaria encontrada' })
  @ApiResponse({ status: 404, description: 'Conciliación bancaria no encontrada' })
  findConciliacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findConciliacion(id, empresaId);
  }

  @Get('direcciones')
  @ApiOperation({ summary: 'Listar direcciones de bancos' })
  @ApiResponse({ status: 200, description: 'Lista de direcciones de bancos obtenida exitosamente' })
  findAllDirecciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDirecciones(empresaId);
  }

  @Get('telefonos')
  @ApiOperation({ summary: 'Listar teléfonos de bancos' })
  @ApiResponse({ status: 200, description: 'Lista de teléfonos de bancos obtenida exitosamente' })
  findAllTelefonos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTelefonos(empresaId);
  }
}
