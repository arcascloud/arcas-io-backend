import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Catálogo global de ciudades del mundo (datos importados, solo lectura).
 * No tiene empresaId ni columnas de auditoría por ser referencia externa.
 */
@Entity('ttipoworldcities')
export class TtipoWorldCity {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  city: string;

  @ApiProperty()
  @Column({ name: 'city_ascii', type: 'varchar', length: 50 })
  city_ascii: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 6, default: 0 })
  lat: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 6, default: 0 })
  log: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  country: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  iso2: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  iso3: string;

  @ApiProperty()
  @Column({ name: 'admin_name', type: 'varchar', length: 50 })
  admin_name: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  capital: string;
}
