import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tusuarios } from '../users/entities/usuario.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tusuarios)
    private readonly usersRepo: Repository<Tusuarios>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: {
        usuario: dto.usuario,
        sn_activo: 'S',
      },
    });

    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload: JwtPayload = {
      usuario: user.usuario,
      empresaId: user.empresaId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        usuarioId: user.usuarioId,
        usuario: user.usuario,
        nombre: user.nombre,
        email: user.email,
        empresaId: user.empresaId,
        idsucursal: user.Idsucursal,
      },
    };
  }

  async validateUser(usuario: string, empresaId: number) {
    return this.usersRepo.findOne({
      where: { usuario, empresaId, sn_activo: 'S' },
    });
  }
}
