import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tusuarios } from '../../users/entities/usuario.entity';
import { RolesService } from '../../users/roles.service';
import { secretoJwt } from '../jwt-secret';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Tusuarios)
    private readonly usersRepo: Repository<Tusuarios>,
    private readonly rolesService: RolesService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          return request?.cookies?.ja_token || request?.cookies?.jwt_token || ExtractJwt.fromAuthHeaderAsBearerToken()(request);
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secretoJwt(),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersRepo.findOne({
      where: { usuario: payload.usuario, sn_activo: 'S' },
    });
    if (!user) {
      throw new UnauthorizedException('Token no válido');
    }
    // Contexto completo en req.user: usuarioId para @CurrentUser(),
    // roles para RolesGuard (@Roles) — poblar aquí evita que cada
    // endpoint reconstruya el perfil (mismo shape que /auth/me).
    const roles = await this.rolesService.getRoles(user.usuario, user.empresaId);
    return {
      usuarioId: user.usuarioId,
      usuario: user.usuario,
      nombre: user.nombre,
      email: user.email,
      empresaId: user.empresaId,
      idsucursal: user.Idsucursal,
      roles,
    };
  }
}
