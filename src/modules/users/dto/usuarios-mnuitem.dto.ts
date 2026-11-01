import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioMnuItemDto {
  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ description: 'ID de Módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'Usuario' })
  @IsString() @IsNotEmpty()
  usuario: string;

  @ApiProperty({ description: 'Parent' })
  @IsNumber()
  parent: number;

  @ApiProperty({ description: 'Parent ID' })
  @IsNumber()
  parentId: number;

  @ApiProperty({ description: 'Nivel' })
  @IsNumber()
  levelId: number;

  @ApiProperty({ description: 'Nombre del Parent' })
  @IsString() @IsNotEmpty()
  nameParent: string;

  @ApiProperty({ description: 'Nombre del Item' })
  @IsString() @IsNotEmpty()
  nameItem: string;

  @ApiProperty({ description: 'Label del Item' })
  @IsString() @IsNotEmpty()
  labelItem: string;

  @ApiProperty({ description: 'Icono del Item', required: false })
  @IsString() @IsOptional()
  iconItem?: string;

  @ApiProperty({ description: 'Router Link', required: false })
  @IsString() @IsOptional()
  routerLink?: string;

  @ApiProperty({ description: 'Activo', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

export class UpdateUsuarioMnuItemDto {
  @ApiProperty({ description: 'Parent', required: false })
  @IsNumber() @IsOptional()
  parent?: number;

  @ApiProperty({ description: 'Parent ID', required: false })
  @IsNumber() @IsOptional()
  parentId?: number;

  @ApiProperty({ description: 'Nivel', required: false })
  @IsNumber() @IsOptional()
  levelId?: number;

  @ApiProperty({ description: 'Nombre del Parent', required: false })
  @IsString() @IsOptional()
  nameParent?: string;

  @ApiProperty({ description: 'Nombre del Item', required: false })
  @IsString() @IsOptional()
  nameItem?: string;

  @ApiProperty({ description: 'Label del Item', required: false })
  @IsString() @IsOptional()
  labelItem?: string;

  @ApiProperty({ description: 'Icono del Item', required: false })
  @IsString() @IsOptional()
  iconItem?: string;

  @ApiProperty({ description: 'Router Link', required: false })
  @IsString() @IsOptional()
  routerLink?: string;

  @ApiProperty({ description: 'Activo', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

// ===== Bulk import DTO =====

export class BulkMnuItemDto {
  @ApiProperty({ description: 'ID del item en el CSV (para mapear parent)' })
  @IsNumber()
  csvId: number;

  @ApiProperty({ description: 'Parent ID del CSV (referencia al csvId del padre)' })
  @IsNumber()
  parentId: number;

  @ApiProperty({ description: 'Nivel' })
  @IsNumber()
  levelId: number;

  @ApiProperty({ description: 'Nombre del Parent' })
  @IsString() @IsNotEmpty()
  nameParent: string;

  @ApiProperty({ description: 'Nombre del Item' })
  @IsString() @IsNotEmpty()
  nameItem: string;

  @ApiProperty({ description: 'Label del Item' })
  @IsString() @IsNotEmpty()
  labelItem: string;

  @ApiProperty({ description: 'Icono', required: false })
  @IsString() @IsOptional()
  iconItem?: string;

  @ApiProperty({ description: 'Router Link', required: false })
  @IsString() @IsOptional()
  routerLink?: string;
}

export class BulkCreateMnuItemsDto {
  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ description: 'ID de Modulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'Usuario' })
  @IsString() @IsNotEmpty()
  usuario: string;

  @ApiProperty({ description: 'Items del menu', type: [BulkMnuItemDto] })
  items: BulkMnuItemDto[];
}

// ===== Clonado de menú desde plantilla =====

export class ClonarMenuUsuarioDto {
  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ description: 'Usuario destino del clonado' })
  @IsString() @IsNotEmpty()
  usuario: string;
}
