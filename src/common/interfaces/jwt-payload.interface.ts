export interface JwtPayload {
  usuarioId: number;
  usuario: string;
  empresaId: number;
  sub?: string;
}
