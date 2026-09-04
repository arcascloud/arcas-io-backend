export interface JwtPayload {
  usuario: string;
  empresaId: number;
  sub?: string;
}
