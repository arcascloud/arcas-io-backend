import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tusuarios } from '../../users/entities/usuario.entity';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Tusuarios)
    private readonly usersRepo: Repository<Tusuarios>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'arcas-software-secret-key-2026',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersRepo.findOne({
      where: { usuario: payload.usuario, sn_activo: 'S' },
    });
    if (!user) {
      throw new UnauthorizedException('Token no válido');
    }
    return {
      usuario: user.usuario,
      nombre: user.nombre,
      empresaId: user.empresaId,
      idsucursal: user.Idsucursal,
    };
  }
}
