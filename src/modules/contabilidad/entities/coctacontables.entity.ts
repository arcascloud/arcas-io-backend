import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("coctacontables")
export class Coctacontables {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: "cuentacontablesId" })
  cuentacontablesId: number;

  @ApiProperty()
  @Column({ type: "varchar", length: 20 })
  ctacontable: string;

  @ApiProperty()
  @Column({ type: "varchar", length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: "enum", enum: ["D", "C"], default: "D" })
  naturaleza: string;

  @ApiProperty()
  @Column({ type: "int" })
  nivel: number;

  @ApiProperty({ required: false })
  @Column({ type: "varchar", length: 12, nullable: true })
  padre: string;

  @ApiProperty()
  @Column({ type: "enum", enum: ["S", "N"], default: "S" })
  sn_operable: string;

  @ApiProperty()
  @Column()
  tcogrupocontableId: number;

  @ApiProperty()
  @Column({ type: "enum", enum: ["S", "N"], default: "S" })
  sn_activo: string;

  @ApiProperty()
  @Column({ default: 0 })
  zorden: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column()
  Idsucursal: number;

  @ApiProperty()
  @Column({ type: "varchar", length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: "varchar", length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: "datetime", nullable: true })
  fechaUpdated: Date;
}
