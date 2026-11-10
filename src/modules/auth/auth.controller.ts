import { Controller, Post, Body, Res, UseGuards, Get, Req, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoginRateLimitGuard } from '../../common/guards/login-rate-limit.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LoginRateLimitGuard)
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

    const isProd = process.env.NODE_ENV === 'production';
    const isHttps = request.secure === true || isProd;

    response.cookie("ja_token", resAuth.access_token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 min
      path: "/",
    });

    response.cookie("ja_refresh", resAuth.refresh_token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    return { usuario: resAuth.usuario };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refrescar token de acceso' })
  async refresh(@Req() request: any, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.ja_refresh;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const resAuth = await this.authService.refresh(refreshToken);
    const isProd = process.env.NODE_ENV === 'production';
    const isHttps = request.secure === true || isProd;

    response.cookie("ja_token", resAuth.access_token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    return { ok: true };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión' })
  async logout(@Res({ passthrough: true }) response: Response, @Req() request: any) {
    const usuario = request.user?.usuario;
    if (usuario) {
      await this.authService.logout(usuario);
    }

    const isProd = process.env.NODE_ENV === 'production';
    const isHttps = request.secure === true || isProd;

    response.clearCookie("ja_token", { httpOnly: true, secure: isHttps, sameSite: "lax", path: "/" });
    response.clearCookie("ja_refresh", { httpOnly: true, secure: isHttps, sameSite: "lax", path: "/" });
    response.clearCookie("jwt_token", { httpOnly: true, secure: isHttps, sameSite: "lax", path: "/" });

    return { message: 'Sesión cerrada exitosamente' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Obtener usuario autenticado actual' })
  async getProfile(@Req() req: any) {
    return this.authService.getPerfil(req.user.usuario);
  }

  @Public()
  @Post('registro')
  @ApiOperation({ summary: 'Registro público de usuario (sin sesión)' })
  @ApiResponse({ status: 201, description: 'Usuario creado correctamente' })
  @ApiResponse({ status: 409, description: 'Usuario o correo ya registrado' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
