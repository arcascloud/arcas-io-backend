import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GRUPOS_TIPO_PARAMETRO } from '../entities/tipo-parametro.entity';

export class TipoParametroItemDto {
  @ApiProperty()
  @IsString()
  field: string;

  @ApiPropertyOptional({ description: 'Descripción del parámetro (máx. 80)', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  descripcion?: string;

  @ApiProperty({ enum: ['NUMBER', 'STRING'] })
  @IsEnum(['NUMBER', 'STRING'])
  tipo: string;

  @ApiProperty()
  @IsString()
  valor: string;

  @ApiPropertyOptional({ enum: ['S', 'N'] })
  @IsOptional()
  @IsEnum(['S', 'N'])
  sn_activo?: string;

  @ApiPropertyOptional({ enum: GRUPOS_TIPO_PARAMETRO, description: 'Grupo del parámetro' })
  @IsOptional()
  @IsEnum([...GRUPOS_TIPO_PARAMETRO])
  grupo?: string;
}

export class UpsertParametrosDto {
  @ApiProperty({ type: [TipoParametroItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TipoParametroItemDto)
  parametros: TipoParametroItemDto[];
}

export class TipoParametroQueryDto {
  @ApiProperty()
  @IsNumber()
  empresaId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  moduloId?: number;
}
