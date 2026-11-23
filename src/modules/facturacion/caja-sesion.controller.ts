import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CajaSesionService } from './caja-sesion.service';
import { AbrirCajaSesionDto, CerrarCajaSesionDto, CreateCajaMovimientoDto, GenerarCorteDto } from './dto/caja-sesion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Caja POS (Sesiones, Movimientos y Cortes X/Z)')
@ApiBearerAuth()
@Controller('facturacion/caja')
@UseGuards(JwtAuthGuard)
export class CajaSesionController {
  constructor(private readonly cajaSesionService: CajaSesionService) {}

  @Post('sesiones')
  @ApiOperation({
    summary: 'Abrir una nueva sesión de caja (Turno de caja)',
    description:
      'El empresaId y usuarioId se resuelven del JWT. La caja se resuelve de tusuarios_caja ' +
      '(fallback cxccajeros.usuario). admin/supervisor pueden abrir cualquier caja activa.',
  })
  @ApiResponse({ status: 201, description: 'Sesión abierta exitosamente' })
  @ApiResponse({ status: 403, description: 'El usuario no está autorizado para esa caja' })
  @ApiResponse({ status: 409, description: 'La caja o el usuario ya tienen un turno abierto' })
  abrirSesion(@Body() dto: AbrirCajaSesionDto, @CurrentUser() user: any) {
    return this.cajaSesionService.abrirSesion(dto, user);
  }

  @Get('cajas-disponibles')
  @ApiOperation({ summary: 'Cajas que el usuario autenticado puede operar (tusuarios_caja)' })
  @ApiResponse({ status: 200, description: 'Lista de cajas autorizadas' })
  cajasDisponibles(@CurrentUser() user: any) {
    return this.cajaSesionService.cajasDisponibles(
      Number(user?.empresaId),
      user?.usuario,
      Array.isArray(user?.roles) ? user.roles : [],
    );
  }

  @Get('sesiones/activa')
  @ApiOperation({ summary: 'Obtener la sesión de caja abierta actual' })
  @ApiResponse({ status: 200, description: 'Sesión activa encontrada o null' })
  obtenerSesionActiva(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('cajaId') cajaId?: string,
    @Query('usuarioId') usuarioId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.cajaSesionService.obtenerSesionActiva(
      empresaId,
      cajaId ? Number(cajaId) : undefined,
      usuarioId ? Number(usuarioId) : Number(user?.usuarioId) || undefined,
    );
  }

  @Get('sesiones')
  @ApiOperation({ summary: 'Listar sesiones de caja' })
  @ApiResponse({ status: 200, description: 'Lista de sesiones' })
  listarSesiones(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('cajaId') cajaId?: string,
    @Query('estado') estado?: string,
  ) {
    return this.cajaSesionService.listarSesiones(
      empresaId,
      cajaId ? Number(cajaId) : undefined,
      estado,
    );
  }

  @Get('sesiones/:id')
  @ApiOperation({ summary: 'Obtener detalle completo de una sesión (con movimientos y cortes)' })
  @ApiResponse({ status: 200, description: 'Sesión encontrada' })
  obtenerSesion(@Param('id', ParseIntPipe) id: number) {
    return this.cajaSesionService.obtenerSesionConDetalle(id);
  }

  @Post('sesiones/:id/movimientos')
  @ApiOperation({ summary: 'Registrar un movimiento en la sesión de caja (ej. ingreso/retiro efectivo, venta, etc.)' })
  @ApiResponse({ status: 201, description: 'Movimiento registrado exitosamente' })
  registrarMovimiento(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCajaMovimientoDto,
    @CurrentUser() user: any,
  ) {
    dto.sesionId = id;
    return this.cajaSesionService.registrarMovimiento(dto, user.usuario);
  }

  @Post('sesiones/:id/corte-x')
  @ApiOperation({ summary: 'Generar Corte X (Arqueo parcial sin cerrar turno)' })
  @ApiResponse({ status: 201, description: 'Corte X generado exitosamente' })
  generarCorteX(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GenerarCorteDto,
    @CurrentUser() user: any,
  ) {
    return this.cajaSesionService.generarCorteX(id, dto, user.usuario);
  }

  @Post('sesiones/:id/cerrar')
  @ApiOperation({ summary: 'Cerrar sesión de caja y generar Corte Z (Cierre definitivo)' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada y Corte Z generado exitosamente' })
  cerrarSesion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CerrarCajaSesionDto,
    @CurrentUser() user: any,
  ) {
    return this.cajaSesionService.cerrarSesion(id, dto, user.usuario);
  }
}
