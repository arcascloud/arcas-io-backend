import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMesDto {
  @ApiProperty({ description: 'Nombre del mes' })
  @IsString() @IsNotEmpty()
  mes: string;
}

export class UpdateMesDto {
  @ApiProperty({ required: false, description: 'Nombre del mes' })
  @IsString() @IsOptional()
  mes?: string;
}
