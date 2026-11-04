import { Controller, Post, Body, Res, UseGuards, Get, Req } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Req() request: any,
  ) {
    const resAuth = await this.authService.login(dto);

    // SameSite=None en producción porque frontend (workers.dev) y backend
    // (onrender.com) son sitios distintos (cross-site): con SameSite=Lax el
    // navegador NO enviaría la cookie en las peticiones fetch/XHR autenticadas
    // (login 201 pero /auth/me siempre 401). SameSite=None exige Secure.
    // La detección es por HTTPS real (req.secure vía trust proxy en main.ts),
    // NO por NODE_ENV — en Render NODE_ENV puede no estar definida.
    const isHttps = request.secure === true;
    response.cookie("jwt_token", resAuth.access_token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? "none" : "lax",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
    });

    return resAuth;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión' })
  async logout(@Res({ passthrough: true }) response: Response, @Req() request: any) {
    const isHttps = request.secure === true;
    response.clearCookie("jwt_token", {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? "none" : "lax",
      path: "/",
    });
    return { message: 'Sesión cerrada exitosamente' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Obtener usuario autenticado actual' })
  async getProfile(@Req() req: any) {
    // ARFM20261030: perfil COMPLETO (usuarioId, roles, tipoPersona, sn_cliente)
    // — no el objeto recortado de JwtStrategy, que el frontend sobreescribía
    // sobre el usuario del login en cada navegación.
    return this.authService.getPerfil(req.user.usuario);
  }

  @Post('registro')
  @ApiOperation({ summary: 'Registro público de usuario (sin sesión)' })
  @ApiResponse({ status: 201, description: 'Usuario creado correctamente' })
  @ApiResponse({ status: 409, description: 'Usuario o correo ya registrado' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
