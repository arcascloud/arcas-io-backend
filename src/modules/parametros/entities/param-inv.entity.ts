import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { TtipoImpuesto } from "./impuesto.entity";
import { TPosPrecioVtas } from "@/modules/facturacion/entities/tpospreciovtas.entity";

@Entity("ttipoparaminv")
export class TtipoParamInv {
  @ApiProperty()
  @PrimaryColumn({ name: "empresaId" })
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ type: "int", nullable: true })
  bodegaId: number;

  @ApiProperty({ required: false })
  @Column({ type: "int", nullable: true })
  nrocompra: number;

  @ApiProperty({ required: false })
  @Column({ type: "int", nullable: true })
  nrotrasladoo: number;

  @ApiProperty({ required: false })
  @Column({ type: "int", nullable: true })
  nroajuste: number;

  @ApiProperty({ required: false })
  @Column({ type: "int", nullable: true })
  nrofisico: number;

  @ApiProperty({ required: false })
  @Column({ type: "int", nullable: true })
  nrorequisicion: number;

  @ApiProperty({ required: false })
  @Column({ type: "int", nullable: true })
  impuestocompraId: number;

  @ApiProperty({ type: () => TPosPrecioVtas, required: false })
  @ManyToOne(() => TPosPrecioVtas)
  @JoinColumn({ name: "preciovtaId" })
  preciovtaId: number;

  @ApiProperty({ type: () => TtipoImpuesto, required: false })
  @ManyToOne(() => TtipoImpuesto)
  impuestoCompra: TtipoImpuesto;

  @ApiProperty({ required: false })
  @Column({ type: "int", nullable: true })
  impuestoventaId: number;

  @ApiProperty({ type: () => TtipoImpuesto, required: false })
  @ManyToOne(() => TtipoImpuesto)
  @JoinColumn({ name: "impuestoventaId" })
  impuestoVenta: TtipoImpuesto;

  @ApiProperty()
  @Column({ type: "decimal", precision: 20, scale: 2, default: 0 })
  nropartida: number;

  @ApiProperty()
  @Column({ type: "enum", enum: ["S", "N"], default: "N" })
  sn_requirelote: string;

  @ApiProperty()
  @Column({ type: "enum", enum: ["S", "N"], default: "N" })
  sn_supermercado: string;

  @ApiProperty()
  @Column({ type: "enum", enum: ["S", "N"], default: "N" })
  sn_multiplesprecios: string;

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
