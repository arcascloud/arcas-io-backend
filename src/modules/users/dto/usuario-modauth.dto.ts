import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioModAuthDto {
  @ApiProperty({ description: 'Usuario' })
  @IsString() @IsNotEmpty()
  usuario: string;

  @ApiProperty({ description: 'Descripción', required: false })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'Autoriza Devoluciones', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_devoluciones?: string;

  @ApiProperty({ description: 'Autoriza Reversión', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_reversion?: string;

  @ApiProperty({ description: 'Autoriza Anulaciones', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_anulaciones?: string;

  @ApiProperty({ description: 'Autoriza Facturación', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_facturacion?: string;

  @ApiProperty({ description: 'Autoriza Contabilizar', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_contabilizar?: string;

  @ApiProperty({ description: 'Fecha Operativa', required: false })
  @IsDateString() @IsOptional()
  fechaoperativa?: string;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateUsuarioModAuthDto {
  @ApiProperty({ description: 'Descripción', required: false })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'Autoriza Devoluciones', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_devoluciones?: string;

  @ApiProperty({ description: 'Autoriza Reversión', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_reversion?: string;

  @ApiProperty({ description: 'Autoriza Anulaciones', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_anulaciones?: string;

  @ApiProperty({ description: 'Autoriza Facturación', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_facturacion?: string;

  @ApiProperty({ description: 'Autoriza Contabilizar', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_contabilizar?: string;

  @ApiProperty({ description: 'Fecha Operativa', required: false })
  @IsDateString() @IsOptional()
  fechaoperativa?: string;
}
