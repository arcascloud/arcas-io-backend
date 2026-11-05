import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, ObjectLiteral, Not, In } from "typeorm";
import { Tproducto } from "./entities/producto.entity";
import { TinvCategoria } from "./entities/categoria.entity";
import { TinvMarca } from "./entities/marca.entity";
import { TinvModelo } from "./entities/modelo.entity";
import { TinvColor } from "./entities/color.entity";
import { TinvUnidadMedida } from "./entities/unidad-medida.entity";
import { TinvEmbalaje } from "./entities/embalaje.entity";
import { TinvBodega } from "./entities/bodega.entity";
import { TinvUbicacion } from "./entities/ubicacion.entity";
import { TinvPasillo } from "./entities/pasillo.entity";
import { TinvCasa } from "./entities/casa.entity";
import { TinvTestante } from "./entities/testante.entity";
import { TinvTag } from "./entities/tag.entity";
import { Tproveedor } from "./entities/proveedor.entity";
import { TinvExistencia } from "./entities/existencia.entity";
import { TinvKardex } from "./entities/kardex.entity";
import { TproductoCodBarra } from "./entities/producto-codbarra.entity";
import { TproductoDet } from "./entities/producto-det.entity";
import { TproductoImg } from "./entities/producto-img.entity";
import { CreateProductoDto, UpdateProductoDto } from "./dto/producto.dto";
import { CreateCategoriaDto, UpdateCategoriaDto } from "./dto/categoria.dto";
import { CreateProveedorDto, UpdateProveedorDto } from "./dto/proveedor.dto";
import {
  KardexService,
  KardexEntradaDto,
  KardexSalidaDto,
} from "./kardex.service";
import {
  FechaSistemaService,
  TABLAS_FECHAREGISTRO,
} from "../../shared/fecha-sistema.service";
import { CorrelativosService } from "../../shared/correlativos.service";
import { TipoParametro } from "../parametros/entities/tipo-parametro.entity";
import { TinvDepto } from "./entities/deptos.entity";
import { TPosCboDet } from "../facturacion/entities/poscbodet.entity";
import { TPosDescuentos } from "../facturacion/entities/tposdescuentos.entity";
import { CreateDeptoDto, UpdateDeptoDto } from "./dto/depto.dto";

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Tproducto)
    private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TinvCategoria)
    private readonly categoriaRepo: Repository<TinvCategoria>,
    @InjectRepository(TinvDepto)
    private readonly deptosinvRepo: Repository<TinvDepto>,
    @InjectRepository(TinvMarca)
    private readonly marcaRepo: Repository<TinvMarca>,
    @InjectRepository(TinvModelo)
    private readonly modeloRepo: Repository<TinvModelo>,
    @InjectRepository(TinvColor)
    private readonly colorRepo: Repository<TinvColor>,
    @InjectRepository(TinvUnidadMedida)
    private readonly unidadMedidaRepo: Repository<TinvUnidadMedida>,
    @InjectRepository(TinvEmbalaje)
    private readonly embalajeRepo: Repository<TinvEmbalaje>,
    @InjectRepository(TinvBodega)
    private readonly bodegaRepo: Repository<TinvBodega>,
    @InjectRepository(TinvUbicacion)
    private readonly ubicacionRepo: Repository<TinvUbicacion>,
    @InjectRepository(TinvPasillo)
    private readonly pasilloRepo: Repository<TinvPasillo>,
    @InjectRepository(TinvCasa) private readonly casaRepo: Repository<TinvCasa>,
    @InjectRepository(TinvTestante)
    private readonly testanteRepo: Repository<TinvTestante>,
    @InjectRepository(TinvTag) private readonly tagRepo: Repository<TinvTag>,
    @InjectRepository(Tproveedor)
    private readonly proveedorRepo: Repository<Tproveedor>,
    @InjectRepository(TinvExistencia)
    private readonly existenciaRepo: Repository<TinvExistencia>,
    @InjectRepository(TinvKardex)
    private readonly kardexRepo: Repository<TinvKardex>,
    @InjectRepository(TproductoCodBarra)
    private readonly codBarraRepo: Repository<TproductoCodBarra>,
    @InjectRepository(TproductoDet)
    private readonly prodDetRepo: Repository<TproductoDet>,
    @InjectRepository(TproductoImg)
    private readonly prodImgRepo: Repository<TproductoImg>,
    @Inject(forwardRef(() => KardexService))
    private readonly kardexService: KardexService,
    private readonly fechaSistema: FechaSistemaService,
    private readonly correlativos: CorrelativosService,
    @InjectRepository(TipoParametro)
    private readonly tipoParametroRepo: Repository<TipoParametro>,
    @InjectRepository(TPosCboDet)
    private readonly cboDetRepo: Repository<TPosCboDet>,
    @InjectRepository(TPosDescuentos)
    private readonly descuentosRepo: Repository<TPosDescuentos>,
  ) {}

  private async findAllByEmpresa<T extends ObjectLiteral>(
    repo: Repository<T>,
    empresaId: number,
  ) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
    });
  }

  private async findOneById<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const where = {
      [idField]: id,
      empresaId,
    } as unknown as FindOptionsWhere<T>;
    const found = await repo.findOne({ where });
    if (!found)
      throw new NotFoundException(`${entityName} ${id} no encontrado`);
    return found;
  }

  /** Lee un parametro numerico de ttipoparametros (field/valor) por empresa+modulo. */
  private async getParamMod(
    empresaId: number,
    moduloId: number,
    field: string,
    def: number,
  ): Promise<number> {
    try {
      const row = await this.tipoParametroRepo.findOne({
        where: {
          empresaId,
          moduloId,
          field,
          sn_activo: "S",
        } as unknown as FindOptionsWhere<TipoParametro>,
      });
      const n = Number(row?.valor);
      return Number.isFinite(n) ? n : def;
    } catch {
      return def;
    }
  }

  /** Lee un parametro de ttipoparametros (field/valor) por empresa+modulo, STRING, con fallback. */
  private async getParamGiro(empresaId: number): Promise<string> {
    try {
      const row = await this.tipoParametroRepo.findOne({
        where: {
          empresaId,
          moduloId: 1,
          field: "tipo_de_giro_tienda",
          sn_activo: "S",
        } as unknown as FindOptionsWhere<TipoParametro>,
      });
      if (row && row.valor) return String(row.valor);
    } catch {
      // parámetro ausente → fallback a 'C'
    }
    return "";
  }

  private async createEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    dto: any,
    currentUser: string,
  ): Promise<T> {
    const datos: any = { ...dto, usuarioCreated: currentUser };
    // Reglas 1 y 4: de este service solo `proveedor` e `invkardex` están en
    // TABLAS_FECHAREGISTRO → a ellas se les estampa `fecharegistro` con
    // obtenerFechaRegistro(); el resto (productos, categorías, bodegas, … es
    // catálogo) no entra al if y conserva su comportamiento actual.
    if (TABLAS_FECHAREGISTRO.has(repo.metadata.tableName)) {
      datos.fecharegistro = await this.fechaSistema.obtenerFechaRegistro(
        currentUser,
        dto.empresaId,
      );
    }
    const entity = repo.create(datos);
    const saved = await repo.save(entity);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  private async updateEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    dto: any,
    currentUser: string,
    entityName: string,
  ) {
    const entity = await this.findOneById(
      repo,
      idField,
      id,
      empresaId,
      entityName,
    );
    const { fecharegistro, ...cambios } = dto ?? {}; // nunca se re-estampa en un PUT
    Object.assign(entity, cambios, {
      usuarioUpdated: currentUser,
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
    });
    return repo.save(entity);
  }

  private async softDelete<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const entity = await this.findOneById(
      repo,
      idField,
      id,
      empresaId,
      entityName,
    );
    Object.assign(entity, {
      sn_activo: "N",
      fechaUpdated: await this.fechaSistema.getFecha(empresaId),
    });
    return repo.save(entity);
  }

  async findAllProductos(empresaId: number) {
    return this.productoRepo.find({
      where: { empresaId },
      order: { descripcion: "ASC" },
      relations: ["categoria"],
    });
  }

  async findAllProductosPaginated(empresaId: number, page = 1, limit = 25) {
    const [data, total] = await this.productoRepo.findAndCount({
      where: { empresaId },
      order: { descripcion: "ASC" },
      relations: ["categoria"],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async searchProductos(empresaId: number, termino: string) {
    const qb = this.productoRepo.createQueryBuilder("p");
    qb.where("p.empresaId = :empresaId", { empresaId });
    qb.andWhere("(p.descripcion LIKE :t OR p.codbarra LIKE :t)", {
      t: `%${termino}%`,
    });
    qb.orderBy("p.descripcion", "ASC");
    qb.leftJoinAndSelect("p.categoria", "categoria");
    return qb.getMany();
  }

  async findProducto(produtoId: number, empresaId: number) {
    return this.findOneById(
      this.productoRepo,
      "produtoId",
      produtoId,
      empresaId,
      "Producto",
    );
  }

  async createProducto(dto: CreateProductoDto, currentUser: string) {
    return this.createEntity(this.productoRepo, dto, currentUser);
  }

  async updateProducto(
    produtoId: number,
    empresaId: number,
    dto: UpdateProductoDto,
    currentUser: string,
  ) {
    const actualizado = await this.updateEntity(
      this.productoRepo,
      "produtoId",
      produtoId,
      empresaId,
      dto,
      currentUser,
      "Producto",
    );

    // Sincronización automática de precios en combos (poscbodet):
    // si cambió el precio de venta o el costo unitario, todos los combos que
    // contengan este producto se actualizan con el nuevo precio (menos su
    // descuento, si tiene) y nunca por debajo de costo × 1.03.
    if (dto.precioventa !== undefined || dto.cstounit !== undefined) {
      await this.sincronizarPreciosCombos(produtoId, empresaId, currentUser);
    }

    return actualizado;
  }

  /**
   * Actualiza `poscbodet.precioventa` para todos los detalles de combo que
   * contengan el producto dado. Reglas:
   *  - nuevo precio = precioventa del producto − descuento% (según descuentoId del detalle)
   *  - piso mínimo   = cstounit × 1.03 (nunca vender por debajo del costo + 3%)
   *  - el piso tiene prioridad sobre el descuento (si el descuento baja del
   *    mínimo, se guarda el mínimo).
   * Best-effort: un fallo aquí nunca debe impedir guardar el producto.
   */
  private async sincronizarPreciosCombos(
    produtoId: number,
    empresaId: number,
    currentUser: string,
  ) {
    try {
      const producto = await this.productoRepo.findOne({
        where: { produtoId, empresaId } as unknown as FindOptionsWhere<Tproducto>,
      });
      if (!producto) return;

      const dets = await this.cboDetRepo.find({
        where: { productoId: produtoId, empresaId } as unknown as FindOptionsWhere<TPosCboDet>,
      });
      if (!dets.length) return;

      const base = Number(producto.precioventa) || 0;
      const minimo = Math.round((Number(producto.cstounit) || 0) * 1.03 * 100) / 100;

      // Porcentajes de descuento de los detalles involucrados
      const descIds = [
        ...new Set(
          dets.map((d) => d.descuentoId).filter((v): v is number => v != null),
        ),
      ];
      const descuentos = descIds.length
        ? await this.descuentosRepo.find({
            where: { descuentoId: In(descIds) } as unknown as FindOptionsWhere<TPosDescuentos>,
          })
        : [];
      const pctMap = new Map(descuentos.map((d) => [d.descuentoId, Number(d.porcentaje)]));

      const fecha = await this.fechaSistema.getFecha(empresaId);
      let actualizados = 0;

      for (const det of dets) {
        const pct = det.descuentoId != null ? pctMap.get(det.descuentoId) ?? 0 : 0;
        let nuevo = base - base * (pct / 100);
        if (nuevo < minimo) nuevo = minimo;
        nuevo = Math.round(nuevo * 100) / 100;

        if (Number(det.precioventa) === nuevo) continue;
        // QueryBuilder: evita el change-detection de TypeORM en columnas numéricas
        await this.cboDetRepo
          .createQueryBuilder()
          .update()
          .set({
            precioventa: nuevo,
            usuarioUpdated: currentUser,
            fechaUpdated: fecha,
          })
          .where("poscbodetId = :id", { id: det.poscbodetId })
          .execute();
        actualizados++;
      }

      if (actualizados > 0) {
        console.log(
          `[combos] Sincronizados ${actualizados} detalle(s) de combo del producto ${produtoId} (empresa ${empresaId})`,
        );
      }
    } catch (err) {
      console.error(
        `[combos] Error sincronizando precios de combo para producto ${produtoId}:`,
        err,
      );
    }
  }

  async removeProducto(produtoId: number, empresaId: number) {
    return this.softDelete(
      this.productoRepo,
      "produtoId",
      produtoId,
      empresaId,
      "Producto",
    );
  }

  /**
   * Departamentos de inventario (tinvdeptos).
   * Orden: `zorden` (orden de presentación en productos) y a igualdad, alfabético.
   */
  async findAllDeptosInv(empresaId: number) {
    return this.deptosinvRepo.find({
      where: { empresaId },
      order: { zorden: "ASC", descripcion: "ASC" },
    });
  }

  async findDepto(deptoId: number, empresaId: number) {
    return this.findOneById(
      this.deptosinvRepo,
      "deptoId",
      deptoId,
      empresaId,
      "Departamento",
    );
  }

  async createDepto(dto: CreateDeptoDto, currentUser: string) {
    // UNIQUE (descripcion, empresaId) en BD → 409 legible en vez de ER_DUP_ENTRY (500)
    const duplicado = await this.deptosinvRepo.findOne({
      where: {
        descripcion: dto.descripcion,
        empresaId: dto.empresaId,
      } as unknown as FindOptionsWhere<TinvDepto>,
    });
    if (duplicado) {
      throw new ConflictException(
        `El departamento "${dto.descripcion}" ya está registrado`,
      );
    }
    return this.createEntity(this.deptosinvRepo, dto, currentUser);
  }

  async updateDepto(
    deptoId: number,
    empresaId: number,
    dto: UpdateDeptoDto,
    currentUser: string,
  ) {
    if (dto.descripcion) {
      const duplicado = await this.deptosinvRepo.findOne({
        where: {
          descripcion: dto.descripcion,
          empresaId,
          deptoId: Not(deptoId),
        } as unknown as FindOptionsWhere<TinvDepto>,
      });
      if (duplicado) {
        throw new ConflictException(
          `El departamento "${dto.descripcion}" ya está registrado`,
        );
      }
    }
    return this.updateEntity(
      this.deptosinvRepo,
      "deptoId",
      deptoId,
      empresaId,
      dto,
      currentUser,
      "Departamento",
    );
  }
  
  async findAllCategorias(empresaId: number) {
    return this.findAllByEmpresa(this.categoriaRepo, empresaId);
  }

  async findCategoria(categoriaId: number, empresaId: number) {
    return this.findOneById(
      this.categoriaRepo,
      "categoriaId",
      categoriaId,
      empresaId,
      "Categoria",
    );
  }

  async createCategoria(dto: CreateCategoriaDto, currentUser: string) {
    return this.createEntity(this.categoriaRepo, dto, currentUser);
  }

  async updateCategoria(
    categoriaId: number,
    empresaId: number,
    dto: UpdateCategoriaDto,
    currentUser: string,
  ) {
    return this.updateEntity(
      this.categoriaRepo,
      "categoriaId",
      categoriaId,
      empresaId,
      dto,
      currentUser,
      "Categoria",
    );
  }

  async removeCategoria(categoriaId: number, empresaId: number) {
    return this.softDelete(
      this.categoriaRepo,
      "categoriaId",
      categoriaId,
      empresaId,
      "Categoria",
    );
  }

  async findAllMarcas(empresaId: number) {
    return this.findAllByEmpresa(this.marcaRepo, empresaId);
  }

  async findMarca(marcaId: number, empresaId: number) {
    return this.findOneById(
      this.marcaRepo,
      "marcaId",
      marcaId,
      empresaId,
      "Marca",
    );
  }

  async createMarca(dto: any, currentUser: string) {
    return this.createEntity(this.marcaRepo, dto, currentUser);
  }

  async updateMarca(
    marcaId: number,
    empresaId: number,
    dto: any,
    currentUser: string,
  ) {
    return this.updateEntity(
      this.marcaRepo,
      "marcaId",
      marcaId,
      empresaId,
      dto,
      currentUser,
      "Marca",
    );
  }

  async removeMarca(marcaId: number, empresaId: number) {
    return this.softDelete(
      this.marcaRepo,
      "marcaId",
      marcaId,
      empresaId,
      "Marca",
    );
  }

  async findAllModelos(empresaId: number) {
    return this.findAllByEmpresa(this.modeloRepo, empresaId);
  }

  async findModelo(modeloId: number, empresaId: number) {
    return this.findOneById(
      this.modeloRepo,
      "modeloId",
      modeloId,
      empresaId,
      "Modelo",
    );
  }

  async createModelo(dto: any, currentUser: string) {
    return this.createEntity(this.modeloRepo, dto, currentUser);
  }

  async updateModelo(
    modeloId: number,
    empresaId: number,
    dto: any,
    currentUser: string,
  ) {
    return this.updateEntity(
      this.modeloRepo,
      "modeloId",
      modeloId,
      empresaId,
      dto,
      currentUser,
      "Modelo",
    );
  }

  async removeModelo(modeloId: number, empresaId: number) {
    return this.softDelete(
      this.modeloRepo,
      "modeloId",
      modeloId,
      empresaId,
      "Modelo",
    );
  }

  async findAllColores(empresaId: number) {
    return this.findAllByEmpresa(this.colorRepo, empresaId);
  }

  async findColor(colorId: number, empresaId: number) {
    return this.findOneById(
      this.colorRepo,
      "colorId",
      colorId,
      empresaId,
      "Color",
    );
  }

  async createColor(dto: any, currentUser: string) {
    return this.createEntity(this.colorRepo, dto, currentUser);
  }

  async updateColor(
    colorId: number,
    empresaId: number,
    dto: any,
    currentUser: string,
  ) {
    return this.updateEntity(
      this.colorRepo,
      "colorId",
      colorId,
      empresaId,
      dto,
      currentUser,
      "Color",
    );
  }

  async removeColor(colorId: number, empresaId: number) {
    return this.softDelete(
      this.colorRepo,
      "colorId",
      colorId,
      empresaId,
      "Color",
    );
  }

  async findAllUnidadesMedida(empresaId: number) {
    return this.findAllByEmpresa(this.unidadMedidaRepo, empresaId);
  }

  async findUnidadMedida(unidadmedidaId: number, empresaId: number) {
    return this.findOneById(
      this.unidadMedidaRepo,
      "unidadmedidaId",
      unidadmedidaId,
      empresaId,
      "Unidad de Medida",
    );
  }

  async createUnidadMedida(dto: any, currentUser: string) {
    return this.createEntity(this.unidadMedidaRepo, dto, currentUser);
  }

  async updateUnidadMedida(
    unidadmedidaId: number,
    empresaId: number,
    dto: any,
    currentUser: string,
  ) {
    return this.updateEntity(
      this.unidadMedidaRepo,
      "unidadmedidaId",
      unidadmedidaId,
      empresaId,
      dto,
      currentUser,
      "Unidad de Medida",
    );
  }

  async removeUnidadMedida(unidadmedidaId: number, empresaId: number) {
    return this.softDelete(
      this.unidadMedidaRepo,
      "unidadmedidaId",
      unidadmedidaId,
      empresaId,
      "Unidad de Medida",
    );
  }

  async findAllEmbalajes(empresaId: number) {
    return this.findAllByEmpresa(this.embalajeRepo, empresaId);
  }

  async findEmbalaje(embalajeId: number, empresaId: number) {
    return this.findOneById(
      this.embalajeRepo,
      "embalajeId",
      embalajeId,
      empresaId,
      "Embalaje",
    );
  }

  async createEmbalaje(dto: any, currentUser: string) {
    return this.createEntity(this.embalajeRepo, dto, currentUser);
  }

  async updateEmbalaje(
    embalajeId: number,
    empresaId: number,
    dto: any,
    currentUser: string,
  ) {
    return this.updateEntity(
      this.embalajeRepo,
      "embalajeId",
      embalajeId,
      empresaId,
      dto,
      currentUser,
      "Embalaje",
    );
  }

  async removeEmbalaje(embalajeId: number, empresaId: number) {
    return this.softDelete(
      this.embalajeRepo,
      "embalajeId",
      embalajeId,
      empresaId,
      "Embalaje",
    );
  }

  async findAllBodegas(empresaId: number) {
    return this.findAllByEmpresa(this.bodegaRepo, empresaId);
  }

  async findBodega(bodegaId: number, empresaId: number) {
    return this.findOneById(
      this.bodegaRepo,
      "bodegaId",
      bodegaId,
      empresaId,
      "Bodega",
    );
  }

  async createBodega(dto: any, currentUser: string) {
    return this.createEntity(this.bodegaRepo, dto, currentUser);
  }

  async updateBodega(
    bodegaId: number,
    empresaId: number,
    dto: any,
    currentUser: string,
  ) {
    return this.updateEntity(
      this.bodegaRepo,
      "bodegaId",
      bodegaId,
      empresaId,
      dto,
      currentUser,
      "Bodega",
    );
  }

  async removeBodega(bodegaId: number, empresaId: number) {
    return this.softDelete(
      this.bodegaRepo,
      "bodegaId",
      bodegaId,
      empresaId,
      "Bodega",
    );
  }

  async findAllUbicaciones(empresaId: number) {
    return this.findAllByEmpresa(this.ubicacionRepo, empresaId);
  }

  async findUbicacion(ubicacionId: number, empresaId: number) {
    return this.findOneById(
      this.ubicacionRepo,
      "ubicacionId",
      ubicacionId,
      empresaId,
      "Ubicacion",
    );
  }

  async createUbicacion(dto: any, currentUser: string) {
    return this.createEntity(this.ubicacionRepo, dto, currentUser);
  }

  async updateUbicacion(
    ubicacionId: number,
    empresaId: number,
    dto: any,
    currentUser: string,
  ) {
    return this.updateEntity(
      this.ubicacionRepo,
      "ubicacionId",
      ubicacionId,
      empresaId,
      dto,
      currentUser,
      "Ubicacion",
    );
  }

  async removeUbicacion(ubicacionId: number, empresaId: number) {
    return this.softDelete(
      this.ubicacionRepo,
      "ubicacionId",
      ubicacionId,
      empresaId,
      "Ubicacion",
    );
  }

  async findAllPasillos(empresaId: number) {
    return this.findAllByEmpresa(this.pasilloRepo, empresaId);
  }

  async findPasillo(pasilloId: number, empresaId: number) {
    return this.findOneById(
      this.pasilloRepo,
      "pasilloId",
      pasilloId,
      empresaId,
      "Pasillo",
    );
  }

  async createPasillo(dto: any, currentUser: string) {
    return this.createEntity(this.pasilloRepo, dto, currentUser);
  }

  async updatePasillo(
    pasilloId: number,
    empresaId: number,
    dto: any,
    currentUser: string,
  ) {
    return this.updateEntity(
      this.pasilloRepo,
      "pasilloId",
      pasilloId,
      empresaId,
      dto,
      currentUser,
      "Pasillo",
    );
  }

  async removePasillo(pasilloId: number, empresaId: number) {
    return this.softDelete(
      this.pasilloRepo,
      "pasilloId",
      pasilloId,
      empresaId,
      "Pasillo",
    );
  }

  async findAllCasas(empresaId: number) {
    return this.findAllByEmpresa(this.casaRepo, empresaId);
  }

  async findCasa(casaId: number, empresaId: number) {
    return this.findOneById(this.casaRepo, "casaId", casaId, empresaId, "Casa");
  }

  async createCasa(dto: any, currentUser: string) {
    return this.createEntity(this.casaRepo, dto, currentUser);
  }

  async updateCasa(
    casaId: number,
    empresaId: number,
    dto: any,
    currentUser: string,
  ) {
    return this.updateEntity(
      this.casaRepo,
      "casaId",
      casaId,
      empresaId,
      dto,
      currentUser,
      "Casa",
    );
  }

  async removeCasa(casaId: number, empresaId: number) {
    return this.softDelete(this.casaRepo, "casaId", casaId, empresaId, "Casa");
  }

  async findAllTestantes(empresaId: number) {
    return this.findAllByEmpresa(this.testanteRepo, empresaId);
  }

  async findTestante(testanteId: number, empresaId: number) {
    return this.findOneById(
      this.testanteRepo,
      "testanteId",
      testanteId,
      empresaId,
      "Testante",
    );
  }

  async createTestante(dto: any, currentUser: string) {
    return this.createEntity(this.testanteRepo, dto, currentUser);
  }

  async updateTestante(
    testanteId: number,
    empresaId: number,
    dto: any,
    currentUser: string,
  ) {
    return this.updateEntity(
      this.testanteRepo,
      "testanteId",
      testanteId,
      empresaId,
      dto,
      currentUser,
      "Testante",
    );
  }

  async removeTestante(testanteId: number, empresaId: number) {
    return this.softDelete(
      this.testanteRepo,
      "testanteId",
      testanteId,
      empresaId,
      "Testante",
    );
  }

  async findAllTags(empresaId: number) {
    return this.findAllByEmpresa(this.tagRepo, empresaId);
  }

  async findTag(tagsId: number, empresaId: number) {
    return this.findOneById(this.tagRepo, "tagsId", tagsId, empresaId, "Tag");
  }

  async createTag(dto: any, currentUser: string) {
    return this.createEntity(this.tagRepo, dto, currentUser);
  }

  async updateTag(
    tagsId: number,
    empresaId: number,
    dto: any,
    currentUser: string,
  ) {
    return this.updateEntity(
      this.tagRepo,
      "tagsId",
      tagsId,
      empresaId,
      dto,
      currentUser,
      "Tag",
    );
  }

  async removeTag(tagsId: number, empresaId: number) {
    return this.softDelete(this.tagRepo, "tagsId", tagsId, empresaId, "Tag");
  }

  async findAllProveedores(empresaId: number) {
    return this.findAllByEmpresa(this.proveedorRepo, empresaId);
  }

  async findProveedor(proveedorId: number, empresaId: number) {
    return this.findOneById(
      this.proveedorRepo,
      "proveedorId",
      proveedorId,
      empresaId,
      "Proveedor",
    );
  }

  /**
   * Verifica si un DNI ya existe en proveedores de la empresa (DNI = llave maestra).
   * excluirId permite ignorar el propio registro al editar.
   */
  async verificarDniProveedor(
    empresaId: number,
    dni: string,
    excluirId?: number,
  ) {
    const valor = (dni || "").trim();
    if (!valor) return { existe: false, id: null, numero: null, nombre: null };
    const where: any = { empresaId, dni: valor };
    if (excluirId) where.proveedorId = Not(excluirId);
    const found = await this.proveedorRepo.findOne({ where });
    return {
      existe: !!found,
      id: found ? found.proveedorId : null,
      numero: found ? found.nroproveedor : null,
      nombre: found ? `${found.nombres} ${found.apellidos}` : null,
    };
  }

  async createProveedor(dto: CreateProveedorDto, currentUser: string) {
    // DNI = llave maestra: bloquear duplicado por empresa (solo si el dto trae DNI;
    // sin DNI el payload guarda NULL, que el unique de MySQL permite repetir)
    const dniEfectivo = (dto.dni || "").trim();
    if (dniEfectivo) {
      const dupProv = await this.proveedorRepo.findOne({
        where: { empresaId: dto.empresaId, dni: dniEfectivo } as any,
      });
      if (dupProv) {
        throw new ConflictException(
          `DNI ${dniEfectivo} ya esta registrado a nombre de ${dupProv.nombres} ${dupProv.apellidos} (nro. ${dupProv.nroproveedor})`,
        );
      }
    }

    // Correlativo atómico nroproveedor (ttipoparametros) — solo si no trae número propio
    const payload: any = { ...dto };
    if (!payload.nroproveedor) {
      payload.nroproveedor = await this.correlativos.siguienteString(
        "nroproveedor",
        dto.empresaId,
        currentUser,
        6,
      );
    }
    // Defaults de credito desde ttipoparametros (CxP, moduloId=5) - solo si el dto no los trae
    payload.interes =
      dto.interes ??
      (await this.getParamMod(dto.empresaId, 5, "cxp_interes", 0));
    payload.moratorio =
      dto.moratorio ??
      (await this.getParamMod(dto.empresaId, 5, "cxp_mora", 0));
    payload.diasplazo =
      dto.diasplazo ??
      (await this.getParamMod(dto.empresaId, 5, "cxp_diasPlazo", 0));
    payload.limiteCredito =
      dto.limiteCredito ??
      (await this.getParamMod(dto.empresaId, 5, "cxp_limitecredito", 0));
    return this.createEntity(this.proveedorRepo, payload, currentUser);
  }

  async updateProveedor(
    proveedorId: number,
    empresaId: number,
    dto: UpdateProveedorDto,
    currentUser: string,
  ) {
    // DNI = llave maestra: bloquear que otro proveedor adopte el mismo DNI en la edicion
    if (dto.dni && dto.dni.trim()) {
      const dup = await this.proveedorRepo.findOne({
        where: {
          empresaId,
          dni: dto.dni.trim(),
          proveedorId: Not(proveedorId),
        } as any,
      });
      if (dup) {
        throw new ConflictException(
          `DNI ${dto.dni.trim()} ya esta registrado a nombre de ${dup.nombres} ${dup.apellidos} (nro. ${dup.nroproveedor})`,
        );
      }
    }
    return this.updateEntity(
      this.proveedorRepo,
      "proveedorId",
      proveedorId,
      empresaId,
      dto,
      currentUser,
      "Proveedor",
    );
  }

  async removeProveedor(proveedorId: number, empresaId: number) {
    return this.softDelete(
      this.proveedorRepo,
      "proveedorId",
      proveedorId,
      empresaId,
      "Proveedor",
    );
  }

  async findAllExistencias(empresaId: number) {
    return this.existenciaRepo.find({
      where: { empresaId },
    });
  }

  async findExistencia(invexistenciaId: number, empresaId: number) {
    return this.findOneById(
      this.existenciaRepo,
      "invexistenciaId",
      invexistenciaId,
      empresaId,
      "Existencia",
    );
  }

  async createExistencia(dto: any, currentUser: string) {
    return this.createEntity(this.existenciaRepo, dto, currentUser);
  }

  async updateExistencia(
    invexistenciaId: number,
    empresaId: number,
    dto: any,
    currentUser: string,
  ) {
    return this.updateEntity(
      this.existenciaRepo,
      "invexistenciaId",
      invexistenciaId,
      empresaId,
      dto,
      currentUser,
      "Existencia",
    );
  }

  async findAllKardex(empresaId: number) {
    return this.kardexRepo.find({
      where: { empresaId },
      order: { fecharegistro: "DESC" },
    });
  }

  async findKardex(invkardexId: number, empresaId: number) {
    return this.findOneById(
      this.kardexRepo,
      "invkardexId",
      invkardexId,
      empresaId,
      "Kardex",
    );
  }

  // NOTA: no existe createKardex/updateKardex/removeKardex por diseño.
  // Toda escritura de invkardex DEBE pasar por KardexService.registrarEntrada/
  // registrarSalida (coerción de tipos + cálculo de saldos). Un CRUD genérico
  // de kardex permitiría filas con saldos inconsistentes.

  // ===== ProductoCodBarra =====

  async findAllCodBarra(empresaId: number) {
    return this.codBarraRepo.find({ where: { empresaId } });
  }

  async findCodBarra(productocodbarrasId: number, empresaId: number) {
    return this.findOneById(
      this.codBarraRepo,
      "productocodbarrasId",
      productocodbarrasId,
      empresaId,
      "ProductoCodBarra",
    );
  }

  async createCodBarra(dto: any, currentUser: string) {
    return this.createEntity(this.codBarraRepo, dto, currentUser);
  }

  async updateCodBarra(
    productocodbarrasId: number,
    empresaId: number,
    dto: any,
    currentUser: string,
  ) {
    return this.updateEntity(
      this.codBarraRepo,
      "productocodbarrasId",
      productocodbarrasId,
      empresaId,
      dto,
      currentUser,
      "ProductoCodBarra",
    );
  }

  async removeCodBarra(productocodbarrasId: number, empresaId: number) {
    return this.softDelete(
      this.codBarraRepo,
      "productocodbarrasId",
      productocodbarrasId,
      empresaId,
      "ProductoCodBarra",
    );
  }

  // ===== ProductoDet =====

  async findAllProdDet(empresaId: number, produtoId?: number) {
    const where: any = { empresaId };
    if (produtoId) where.produtoId = produtoId;
    return this.prodDetRepo.find({ where });
  }

  async findProdDet(productosdetsId: number, empresaId: number) {
    return this.findOneById(
      this.prodDetRepo,
      "productosdetsId",
      productosdetsId,
      empresaId,
      "ProductoDet",
    );
  }

  async createProdDet(dto: any, currentUser: string) {
    return this.createEntity(this.prodDetRepo, dto, currentUser);
  }

  async updateProdDet(
    productosdetsId: number,
    empresaId: number,
    dto: any,
    currentUser: string,
  ) {
    return this.updateEntity(
      this.prodDetRepo,
      "productosdetsId",
      productosdetsId,
      empresaId,
      dto,
      currentUser,
      "ProductoDet",
    );
  }

  async removeProdDet(productosdetsId: number, empresaId: number) {
    return this.softDelete(
      this.prodDetRepo,
      "productosdetsId",
      productosdetsId,
      empresaId,
      "ProductoDet",
    );
  }

  // ===== ProductoImg =====

  async findAllProdImg(empresaId: number, productoId?: number) {
    const where: any = { empresaId };
    if (productoId) where.productoId = productoId;
    return this.prodImgRepo.find({ where });
  }

  async findProductosTienda(empresaId?: number, origen?: string) {
    // Canal público (tienda online): sin sesión no hay empresaId de usuario →
    // se resuelve la empresa default del catálogo.
    if (!empresaId) empresaId = await this.fechaSistema.empresaDefault();
    // Filtro parametrizado desde ttipoparametros (field=tipo_de_giro_tienda, moduloId=1).
    // Se APLICA SOLO cuando origen === 'tienda' (carga de /facturacion/tienda y pedidos-virtual).
    const giroFiltro: string | null =
      origen === "tienda" ? (await this.getParamGiro(empresaId)) : null;
    const productos = await this.productoRepo.find({
      where: { empresaId, sn_activo: "S" as any },
      order: { descripcion: "ASC" },
      relations: ["categoria"],
    });

    const productoIds = productos.map((p) => p.produtoId);

    const imagenes = productoIds.length
      ? await this.prodImgRepo.find({
          where: productoIds.map(
            (id) => ({ productoId: id, empresaId, sn_activo: "S" }) as any,
          ),
        })
      : [];

    const imagenMap = new Map<number, string>();
    for (const img of imagenes) {
      if (!imagenMap.has(img.productoId)) {
        imagenMap.set(img.productoId, img.img);
      }
    }

    const existencias = productoIds.length
      ? await this.existenciaRepo.find({
          where: productoIds.map(
            (id) => ({ productoId: id, empresaId }) as any,
          ),
        })
      : [];

    const existenciaMap = new Map<number, number>();
    const costoMap = new Map<number, number>();
    for (const ex of existencias) {
      const total = existenciaMap.get(ex.productoId) || 0;
      existenciaMap.set(ex.productoId, total + Number(ex.existencia));
      if (ex.costounitario && Number(ex.costounitario) > 0) {
        const actual = costoMap.get(ex.productoId) || 0;
        costoMap.set(ex.productoId, actual + Number(ex.costounitario));
      }
    }

    const costoCountMap = new Map<number, number>();
    for (const ex of existencias) {
      if (ex.costounitario && Number(ex.costounitario) > 0) {
        costoCountMap.set(
          ex.productoId,
          (costoCountMap.get(ex.productoId) || 0) + 1,
        );
      }
    }

    const items = productos.map((p) => ({
      produtoId: p.produtoId,
      descripcion: p.descripcion,
      descripcion_corta: p.descripcion_corta,
      codbarra: p.codbarra,
      precioventa: Number(p.precioventa),
      preciocosto: costoCountMap.get(p.produtoId)
        ? Number(costoMap.get(p.produtoId)) /
          Number(costoCountMap.get(p.produtoId))
        : 0,
      imagen: imagenMap.get(p.produtoId) || null,
      existencia: existenciaMap.get(p.produtoId) || 0,
      categoria: p.categoria?.descripcion || null,
      categoriaId: p.categoriaId,
      marcaId: p.marcaId,
      deptoId: p.deptoId,
      categoriaDeptoId: p.categoria?.deptoId || null,
      tipo_giro: p.categoria?.tipo_giro || 'C',
    }));

    if (giroFiltro) {
      // Solo las categorías de giro 'C' parametrizadas en ttipoparametros.
      return items.filter((x) => x.tipo_giro === giroFiltro);
    }
    return items;
  }

  async findProdImg(productoimgId: number, empresaId: number) {
    return this.findOneById(
      this.prodImgRepo,
      "productoimgId",
      productoimgId,
      empresaId,
      "ProductoImg",
    );
  }

  async createProdImg(dto: any, currentUser: string) {
    return this.createEntity(this.prodImgRepo, dto, currentUser);
  }

  async updateProdImg(
    productoimgId: number,
    empresaId: number,
    dto: any,
    currentUser: string,
  ) {
    return this.updateEntity(
      this.prodImgRepo,
      "productoimgId",
      productoimgId,
      empresaId,
      dto,
      currentUser,
      "ProductoImg",
    );
  }

  async removeProdImg(productoimgId: number, empresaId: number) {
    return this.softDelete(
      this.prodImgRepo,
      "productoimgId",
      productoimgId,
      empresaId,
      "ProductoImg",
    );
  }

  async registrarAjustePositivo(dto: {
    bodegaId: number;
    productoId: number;
    cantidad: number;
    costoUnitario: number;
    nroreferencia: string;
    empresaId: number;
    usuarioCreated: string;
    factordecambio?: number;
    codbarra?: string;
  }): Promise<void> {
    await this.kardexService.registrarEntrada({
      ...dto,
      moduloId: 4,
      tipomov: "E",
      subtipoMov: "A",
    });
  }

  async registrarAjusteNegativo(dto: {
    bodegaId: number;
    productoId: number;
    cantidad: number;
    costoUnitario: number;
    nroreferencia: string;
    empresaId: number;
    usuarioCreated: string;
    factordecambio?: number;
    codbarra?: string;
  }): Promise<void> {
    await this.kardexService.registrarSalida({
      ...dto,
      moduloId: 4,
      tipomov: "S",
      subtipoMov: "A",
    });
  }

  async registrarTraslado(dto: {
    bodegaOrigenId: number;
    bodegaDestinoId: number;
    productoId: number;
    cantidad: number;
    costoUnitario: number;
    nroreferencia: string;
    empresaId: number;
    usuarioCreated: string;
    factordecambio?: number;
    codbarra?: string;
  }): Promise<void> {
    await this.kardexService.registrarSalida({
      bodegaId: dto.bodegaOrigenId,
      productoId: dto.productoId,
      cantidad: dto.cantidad,
      costoUnitario: dto.costoUnitario,
      nroreferencia: dto.nroreferencia,
      moduloId: 4,
      tipomov: "S",
      subtipoMov: "T",
      empresaId: dto.empresaId,
      usuarioCreated: dto.usuarioCreated,
      factordecambio: dto.factordecambio,
      codbarra: dto.codbarra,
    });

    await this.kardexService.registrarEntrada({
      bodegaId: dto.bodegaDestinoId,
      productoId: dto.productoId,
      cantidad: dto.cantidad,
      costoUnitario: dto.costoUnitario,
      nroreferencia: dto.nroreferencia,
      moduloId: 4,
      tipomov: "E",
      subtipoMov: "T",
      empresaId: dto.empresaId,
      usuarioCreated: dto.usuarioCreated,
      factordecambio: dto.factordecambio,
      codbarra: dto.codbarra,
    });
  }
}
