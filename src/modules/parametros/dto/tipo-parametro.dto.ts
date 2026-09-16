import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TipoParametroItemDto {
  @ApiProperty()
  @IsString()
  field: string;

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
