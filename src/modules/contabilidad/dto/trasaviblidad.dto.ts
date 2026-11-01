import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, ValidateNested } from 'class-validator';

export class CreateTrasaviblidadDto {
  @ApiPropertyOptional({ description: 'ID maestro en la tabla transaccional del módulo' })
  @IsInt()
  @IsOptional()
  referenciaId?: number;

  @ApiPropertyOptional({ description: 'Módulo dueño del documento (tmodulos.moduloId)' })
  @IsInt()
  @IsOptional()
  moduloId?: number;

  @ApiPropertyOptional({ description: 'Partida contable (copdamae.partidaId)' })
  @IsInt()
  @IsOptional()
  partidaId?: number;

  @ApiPropertyOptional({ description: 'Sucursal (tsucursal.Idsucursal)' })
  @IsInt()
  @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ description: 'Empresa' })
  @IsInt()
  empresaId: number;
}

export class BulkTrasaviblidadDto {
  @ApiProperty({ type: [CreateTrasaviblidadDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTrasaviblidadDto)
  registros: CreateTrasaviblidadDto[];
}
