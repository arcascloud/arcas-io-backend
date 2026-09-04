import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { Tproducto } from './entities/producto.entity';
import { TinvCategoria } from './entities/categoria.entity';
import { TinvMarca } from './entities/marca.entity';
import { TinvModelo } from './entities/modelo.entity';
import { TinvColor } from './entities/color.entity';
import { TinvUnidadMedida } from './entities/unidad-medida.entity';
import { TinvEmbalaje } from './entities/embalaje.entity';
import { TinvBodega } from './entities/bodega.entity';
import { TinvUbicacion } from './entities/ubicacion.entity';
import { TinvPasillo } from './entities/pasillo.entity';
import { TinvCasa } from './entities/casa.entity';
import { TinvTestante } from './entities/testante.entity';
import { TinvTag } from './entities/tag.entity';
import { Tproveedor } from './entities/proveedor.entity';
import { TinvExistencia } from './entities/existencia.entity';
import { TinvKardex } from './entities/kardex.entity';
import { TproductoCodBarra } from './entities/producto-codbarra.entity';
import { TproductoDet } from './entities/producto-det.entity';
import { TproductoImg } from './entities/producto-img.entity';
import { CreateProductoDto, UpdateProductoDto } from './dto/producto.dto';
import { CreateCategoriaDto, UpdateCategoriaDto } from './dto/categoria.dto';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';
import { KardexService, KardexEntradaDto, KardexSalidaDto } from './kardex.service';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TinvCategoria) private readonly categoriaRepo: Repository<TinvCategoria>,
    @InjectRepository(TinvMarca) private readonly marcaRepo: Repository<TinvMarca>,
    @InjectRepository(TinvModelo) private readonly modeloRepo: Repository<TinvModelo>,
    @InjectRepository(TinvColor) private readonly colorRepo: Repository<TinvColor>,
    @InjectRepository(TinvUnidadMedida) private readonly unidadMedidaRepo: Repository<TinvUnidadMedida>,
    @InjectRepository(TinvEmbalaje) private readonly embalajeRepo: Repository<TinvEmbalaje>,
    @InjectRepository(TinvBodega) private readonly bodegaRepo: Repository<TinvBodega>,
    @InjectRepository(TinvUbicacion) private readonly ubicacionRepo: Repository<TinvUbicacion>,
    @InjectRepository(TinvPasillo) private readonly pasilloRepo: Repository<TinvPasillo>,
    @InjectRepository(TinvCasa) private readonly casaRepo: Repository<TinvCasa>,
    @InjectRepository(TinvTestante) private readonly testanteRepo: Repository<TinvTestante>,
    @InjectRepository(TinvTag) private readonly tagRepo: Repository<TinvTag>,
    @InjectRepository(Tproveedor) private readonly proveedorRepo: Repository<Tproveedor>,
    @InjectRepository(TinvExistencia) private readonly existenciaRepo: Repository<TinvExistencia>,
    @InjectRepository(TinvKardex) private readonly kardexRepo: Repository<TinvKardex>,
    @InjectRepository(TproductoCodBarra) private readonly codBarraRepo: Repository<TproductoCodBarra>,
    @InjectRepository(TproductoDet) private readonly prodDetRepo: Repository<TproductoDet>,
    @InjectRepository(TproductoImg) private readonly prodImgRepo: Repository<TproductoImg>,
    @Inject(forwardRef(() => KardexService)) private readonly kardexService: KardexService,
  ) {}

  private async findAllByEmpresa<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number) {
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
    const where = { [idField]: id, empresaId } as unknown as FindOptionsWhere<T>;
    const found = await repo.findOne({ where });
    if (!found) throw new NotFoundException(`${entityName} ${id} no encontrado`);
    return found;
  }

  private async createEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    dto: any,
    currentUser: string,
  ): Promise<T> {
    const entity = repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
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
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
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
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  async findAllProductos(empresaId: number) {
    return this.productoRepo.find({
      where: { empresaId },
      order: { descripcion: 'ASC' },
      relations: ['categoria'],
    });
  }

  async findAllProductosPaginated(empresaId: number, page = 1, limit = 25) {
    const [data, total] = await this.productoRepo.findAndCount({
      where: { empresaId },
      order: { descripcion: 'ASC' },
      relations: ['categoria'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async searchProductos(empresaId: number, termino: string) {
    const qb = this.productoRepo.createQueryBuilder('p');
    qb.where('p.empresaId = :empresaId', { empresaId });
    qb.andWhere('(p.descripcion LIKE :t OR p.codbarra LIKE :t)', { t: `%${termino}%` });
    qb.orderBy('p.descripcion', 'ASC');
    qb.leftJoinAndSelect('p.categoria', 'categoria');
    return qb.getMany();
  }

  async findProducto(produtoId: number, empresaId: number) {
    return this.findOneById(this.productoRepo, 'produtoId', produtoId, empresaId, 'Producto');
  }

  async createProducto(dto: CreateProductoDto, currentUser: string) {
    return this.createEntity(this.productoRepo, dto, currentUser);
  }

  async updateProducto(produtoId: number, empresaId: number, dto: UpdateProductoDto, currentUser: string) {
    return this.updateEntity(this.productoRepo, 'produtoId', produtoId, empresaId, dto, currentUser, 'Producto');
  }

  async removeProducto(produtoId: number, empresaId: number) {
    return this.softDelete(this.productoRepo, 'produtoId', produtoId, empresaId, 'Producto');
  }

  async findAllCategorias(empresaId: number) {
    return this.findAllByEmpresa(this.categoriaRepo, empresaId);
  }

  async findCategoria(categoriaId: number, empresaId: number) {
    return this.findOneById(this.categoriaRepo, 'categoriaId', categoriaId, empresaId, 'Categoria');
  }

  async createCategoria(dto: CreateCategoriaDto, currentUser: string) {
    return this.createEntity(this.categoriaRepo, dto, currentUser);
  }

  async updateCategoria(categoriaId: number, empresaId: number, dto: UpdateCategoriaDto, currentUser: string) {
    return this.updateEntity(this.categoriaRepo, 'categoriaId', categoriaId, empresaId, dto, currentUser, 'Categoria');
  }

  async removeCategoria(categoriaId: number, empresaId: number) {
    return this.softDelete(this.categoriaRepo, 'categoriaId', categoriaId, empresaId, 'Categoria');
  }

  async findAllMarcas(empresaId: number) {
    return this.findAllByEmpresa(this.marcaRepo, empresaId);
  }

  async findMarca(marcaId: number, empresaId: number) {
    return this.findOneById(this.marcaRepo, 'marcaId', marcaId, empresaId, 'Marca');
  }

  async createMarca(dto: any, currentUser: string) {
    return this.createEntity(this.marcaRepo, dto, currentUser);
  }

  async updateMarca(marcaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.marcaRepo, 'marcaId', marcaId, empresaId, dto, currentUser, 'Marca');
  }

  async removeMarca(marcaId: number, empresaId: number) {
    return this.softDelete(this.marcaRepo, 'marcaId', marcaId, empresaId, 'Marca');
  }

  async findAllModelos(empresaId: number) {
    return this.findAllByEmpresa(this.modeloRepo, empresaId);
  }

  async findModelo(modeloId: number, empresaId: number) {
    return this.findOneById(this.modeloRepo, 'modeloId', modeloId, empresaId, 'Modelo');
  }

  async createModelo(dto: any, currentUser: string) {
    return this.createEntity(this.modeloRepo, dto, currentUser);
  }

  async updateModelo(modeloId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.modeloRepo, 'modeloId', modeloId, empresaId, dto, currentUser, 'Modelo');
  }

  async removeModelo(modeloId: number, empresaId: number) {
    return this.softDelete(this.modeloRepo, 'modeloId', modeloId, empresaId, 'Modelo');
  }

  async findAllColores(empresaId: number) {
    return this.findAllByEmpresa(this.colorRepo, empresaId);
  }

  async findColor(colorId: number, empresaId: number) {
    return this.findOneById(this.colorRepo, 'colorId', colorId, empresaId, 'Color');
  }

  async createColor(dto: any, currentUser: string) {
    return this.createEntity(this.colorRepo, dto, currentUser);
  }

  async updateColor(colorId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.colorRepo, 'colorId', colorId, empresaId, dto, currentUser, 'Color');
  }

  async removeColor(colorId: number, empresaId: number) {
    return this.softDelete(this.colorRepo, 'colorId', colorId, empresaId, 'Color');
  }

  async findAllUnidadesMedida(empresaId: number) {
    return this.findAllByEmpresa(this.unidadMedidaRepo, empresaId);
  }

  async findUnidadMedida(unidadmedidaId: number, empresaId: number) {
    return this.findOneById(this.unidadMedidaRepo, 'unidadmedidaId', unidadmedidaId, empresaId, 'Unidad de Medida');
  }

  async createUnidadMedida(dto: any, currentUser: string) {
    return this.createEntity(this.unidadMedidaRepo, dto, currentUser);
  }

  async updateUnidadMedida(unidadmedidaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.unidadMedidaRepo, 'unidadmedidaId', unidadmedidaId, empresaId, dto, currentUser, 'Unidad de Medida');
  }

  async removeUnidadMedida(unidadmedidaId: number, empresaId: number) {
    return this.softDelete(this.unidadMedidaRepo, 'unidadmedidaId', unidadmedidaId, empresaId, 'Unidad de Medida');
  }

  async findAllEmbalajes(empresaId: number) {
    return this.findAllByEmpresa(this.embalajeRepo, empresaId);
  }

  async findEmbalaje(embalajeId: number, empresaId: number) {
    return this.findOneById(this.embalajeRepo, 'embalajeId', embalajeId, empresaId, 'Embalaje');
  }

  async createEmbalaje(dto: any, currentUser: string) {
    return this.createEntity(this.embalajeRepo, dto, currentUser);
  }

  async updateEmbalaje(embalajeId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.embalajeRepo, 'embalajeId', embalajeId, empresaId, dto, currentUser, 'Embalaje');
  }

  async removeEmbalaje(embalajeId: number, empresaId: number) {
    return this.softDelete(this.embalajeRepo, 'embalajeId', embalajeId, empresaId, 'Embalaje');
  }

  async findAllBodegas(empresaId: number) {
    return this.findAllByEmpresa(this.bodegaRepo, empresaId);
  }

  async findBodega(bodegaId: number, empresaId: number) {
    return this.findOneById(this.bodegaRepo, 'bodegaId', bodegaId, empresaId, 'Bodega');
  }

  async createBodega(dto: any, currentUser: string) {
    return this.createEntity(this.bodegaRepo, dto, currentUser);
  }

  async updateBodega(bodegaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.bodegaRepo, 'bodegaId', bodegaId, empresaId, dto, currentUser, 'Bodega');
  }

  async removeBodega(bodegaId: number, empresaId: number) {
    return this.softDelete(this.bodegaRepo, 'bodegaId', bodegaId, empresaId, 'Bodega');
  }

  async findAllUbicaciones(empresaId: number) {
    return this.findAllByEmpresa(this.ubicacionRepo, empresaId);
  }

  async findUbicacion(ubicacionId: number, empresaId: number) {
    return this.findOneById(this.ubicacionRepo, 'ubicacionId', ubicacionId, empresaId, 'Ubicacion');
  }

  async createUbicacion(dto: any, currentUser: string) {
    return this.createEntity(this.ubicacionRepo, dto, currentUser);
  }

  async updateUbicacion(ubicacionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.ubicacionRepo, 'ubicacionId', ubicacionId, empresaId, dto, currentUser, 'Ubicacion');
  }

  async removeUbicacion(ubicacionId: number, empresaId: number) {
    return this.softDelete(this.ubicacionRepo, 'ubicacionId', ubicacionId, empresaId, 'Ubicacion');
  }

  async findAllPasillos(empresaId: number) {
    return this.findAllByEmpresa(this.pasilloRepo, empresaId);
  }

  async findPasillo(pasilloId: number, empresaId: number) {
    return this.findOneById(this.pasilloRepo, 'pasilloId', pasilloId, empresaId, 'Pasillo');
  }

  async createPasillo(dto: any, currentUser: string) {
    return this.createEntity(this.pasilloRepo, dto, currentUser);
  }

  async updatePasillo(pasilloId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.pasilloRepo, 'pasilloId', pasilloId, empresaId, dto, currentUser, 'Pasillo');
  }

  async removePasillo(pasilloId: number, empresaId: number) {
    return this.softDelete(this.pasilloRepo, 'pasilloId', pasilloId, empresaId, 'Pasillo');
  }

  async findAllCasas(empresaId: number) {
    return this.findAllByEmpresa(this.casaRepo, empresaId);
  }

  async findCasa(casaId: number, empresaId: number) {
    return this.findOneById(this.casaRepo, 'casaId', casaId, empresaId, 'Casa');
  }

  async createCasa(dto: any, currentUser: string) {
    return this.createEntity(this.casaRepo, dto, currentUser);
  }

  async updateCasa(casaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.casaRepo, 'casaId', casaId, empresaId, dto, currentUser, 'Casa');
  }

  async removeCasa(casaId: number, empresaId: number) {
    return this.softDelete(this.casaRepo, 'casaId', casaId, empresaId, 'Casa');
  }

  async findAllTestantes(empresaId: number) {
    return this.findAllByEmpresa(this.testanteRepo, empresaId);
  }

  async findTestante(testanteId: number, empresaId: number) {
    return this.findOneById(this.testanteRepo, 'testanteId', testanteId, empresaId, 'Testante');
  }

  async createTestante(dto: any, currentUser: string) {
    return this.createEntity(this.testanteRepo, dto, currentUser);
  }

  async updateTestante(testanteId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.testanteRepo, 'testanteId', testanteId, empresaId, dto, currentUser, 'Testante');
  }

  async removeTestante(testanteId: number, empresaId: number) {
    return this.softDelete(this.testanteRepo, 'testanteId', testanteId, empresaId, 'Testante');
  }

  async findAllTags(empresaId: number) {
    return this.findAllByEmpresa(this.tagRepo, empresaId);
  }

  async findTag(tagsId: number, empresaId: number) {
    return this.findOneById(this.tagRepo, 'tagsId', tagsId, empresaId, 'Tag');
  }

  async createTag(dto: any, currentUser: string) {
    return this.createEntity(this.tagRepo, dto, currentUser);
  }

  async updateTag(tagsId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.tagRepo, 'tagsId', tagsId, empresaId, dto, currentUser, 'Tag');
  }

  async removeTag(tagsId: number, empresaId: number) {
    return this.softDelete(this.tagRepo, 'tagsId', tagsId, empresaId, 'Tag');
  }

  async findAllProveedores(empresaId: number) {
    return this.findAllByEmpresa(this.proveedorRepo, empresaId);
  }

  async findProveedor(proveedorId: number, empresaId: number) {
    return this.findOneById(this.proveedorRepo, 'proveedorId', proveedorId, empresaId, 'Proveedor');
  }

  async createProveedor(dto: CreateProveedorDto, currentUser: string) {
    return this.createEntity(this.proveedorRepo, dto, currentUser);
  }

  async updateProveedor(proveedorId: number, empresaId: number, dto: UpdateProveedorDto, currentUser: string) {
    return this.updateEntity(this.proveedorRepo, 'proveedorId', proveedorId, empresaId, dto, currentUser, 'Proveedor');
  }

  async removeProveedor(proveedorId: number, empresaId: number) {
    return this.softDelete(this.proveedorRepo, 'proveedorId', proveedorId, empresaId, 'Proveedor');
  }

  async findAllExistencias(empresaId: number) {
    return this.existenciaRepo.find({
      where: { empresaId },
    });
  }

  async findExistencia(invexistenciaId: number, empresaId: number) {
    return this.findOneById(this.existenciaRepo, 'invexistenciaId', invexistenciaId, empresaId, 'Existencia');
  }

  async createExistencia(dto: any, currentUser: string) {
    return this.createEntity(this.existenciaRepo, dto, currentUser);
  }

  async updateExistencia(invexistenciaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.existenciaRepo, 'invexistenciaId', invexistenciaId, empresaId, dto, currentUser, 'Existencia');
  }

  async findAllKardex(empresaId: number) {
    return this.kardexRepo.find({
      where: { empresaId },
      order: { fecharegistro: 'DESC' },
    });
  }

  async findKardex(invkardexId: number, empresaId: number) {
    return this.findOneById(this.kardexRepo, 'invkardexId', invkardexId, empresaId, 'Kardex');
  }

  async createKardex(dto: any, currentUser: string) {
    return this.createEntity(this.kardexRepo, dto, currentUser);
  }

  // ===== ProductoCodBarra =====

  async findAllCodBarra(empresaId: number) {
    return this.codBarraRepo.find({ where: { empresaId } });
  }

  async findCodBarra(productocodbarrasId: number, empresaId: number) {
    return this.findOneById(this.codBarraRepo, 'productocodbarrasId', productocodbarrasId, empresaId, 'ProductoCodBarra');
  }

  async createCodBarra(dto: any, currentUser: string) {
    return this.createEntity(this.codBarraRepo, dto, currentUser);
  }

  async updateCodBarra(productocodbarrasId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.codBarraRepo, 'productocodbarrasId', productocodbarrasId, empresaId, dto, currentUser, 'ProductoCodBarra');
  }

  async removeCodBarra(productocodbarrasId: number, empresaId: number) {
    return this.softDelete(this.codBarraRepo, 'productocodbarrasId', productocodbarrasId, empresaId, 'ProductoCodBarra');
  }

  // ===== ProductoDet =====

  async findAllProdDet(empresaId: number) {
    return this.prodDetRepo.find({ where: { empresaId } });
  }

  async findProdDet(productosdetsId: number, empresaId: number) {
    return this.findOneById(this.prodDetRepo, 'productosdetsId', productosdetsId, empresaId, 'ProductoDet');
  }

  async createProdDet(dto: any, currentUser: string) {
    return this.createEntity(this.prodDetRepo, dto, currentUser);
  }

  async updateProdDet(productosdetsId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.prodDetRepo, 'productosdetsId', productosdetsId, empresaId, dto, currentUser, 'ProductoDet');
  }

  async removeProdDet(productosdetsId: number, empresaId: number) {
    return this.softDelete(this.prodDetRepo, 'productosdetsId', productosdetsId, empresaId, 'ProductoDet');
  }

  // ===== ProductoImg =====

  async findAllProdImg(empresaId: number) {
    return this.prodImgRepo.find({ where: { empresaId } });
  }

  async findProductosTienda(empresaId: number) {
    const productos = await this.productoRepo.find({
      where: { empresaId, sn_activo: 'S' as any },
      order: { descripcion: 'ASC' },
      relations: ['categoria'],
    });

    const productoIds = productos.map(p => p.produtoId);

    const imagenes = productoIds.length
      ? await this.prodImgRepo.find({
          where: productoIds.map(id => ({ productoId: id, empresaId, sn_activo: 'S' } as any)),
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
          where: productoIds.map(id => ({ productoId: id, empresaId } as any)),
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
        costoCountMap.set(ex.productoId, (costoCountMap.get(ex.productoId) || 0) + 1);
      }
    }

    return productos.map(p => ({
      produtoId: p.produtoId,
      descripcion: p.descripcion,
      descripcion_corta: p.descripcion_corta,
      codbarra: p.codbarra,
      precioventa: Number(p.precioventa),
      preciocosto: costoCountMap.get(p.produtoId) ? Number(costoMap.get(p.produtoId)) / Number(costoCountMap.get(p.produtoId)) : 0,
      imagen: imagenMap.get(p.produtoId) || null,
      existencia: existenciaMap.get(p.produtoId) || 0,
      categoria: p.categoria?.descripcion || null,
      categoriaId: p.categoriaId,
    }));
  }

  async findProdImg(productoimgId: number, empresaId: number) {
    return this.findOneById(this.prodImgRepo, 'productoimgId', productoimgId, empresaId, 'ProductoImg');
  }

  async createProdImg(dto: any, currentUser: string) {
    return this.createEntity(this.prodImgRepo, dto, currentUser);
  }

  async updateProdImg(productoimgId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.prodImgRepo, 'productoimgId', productoimgId, empresaId, dto, currentUser, 'ProductoImg');
  }

  async removeProdImg(productoimgId: number, empresaId: number) {
    return this.softDelete(this.prodImgRepo, 'productoimgId', productoimgId, empresaId, 'ProductoImg');
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
      tipomov: 'E',
      subtipoMov: 'A',
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
      tipomov: 'S',
      subtipoMov: 'A',
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
      tipomov: 'S',
      subtipoMov: 'T',
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
      tipomov: 'E',
      subtipoMov: 'T',
      empresaId: dto.empresaId,
      usuarioCreated: dto.usuarioCreated,
      factordecambio: dto.factordecambio,
      codbarra: dto.codbarra,
    });
  }
}
