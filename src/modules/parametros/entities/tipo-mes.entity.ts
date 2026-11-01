import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipomes')
export class TTipoMes {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'ttipomes' })
  ttipomesId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50, nullable: true })
  mes: string;
}
