import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('pleasistencia')
export class PlAsistencia {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'plempleadosasistenciaId' })
  plempleadosasistenciaId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  empleadoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'time', nullable: true })
  horaentrada: string;

  @ApiProperty({ required: false })
  @Column({ type: 'time', nullable: true })
  horaalmuerzo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'time', nullable: true })
  horaretorno: string;

  @ApiProperty({ required: false })
  @Column({ type: 'time', nullable: true })
  horarealSalida: string;

  @ApiProperty({ required: false })
  @Column({ type: 'time', nullable: true })
  horasalida: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
