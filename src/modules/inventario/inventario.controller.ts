import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventarioService } from './inventario.service';
import { KardexService, KardexEntradaDto, KardexSalidaDto } from './kardex.service';
import { CreateProductoDto, UpdateProductoDto } from './dto/producto.dto';
import { CreateCategoriaDto, UpdateCategoriaDto } from './dto/categoria.dto';
import { CreateDeptoDto, UpdateDeptoDto } from './dto/depto.dto';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Inventario')
@ApiBearerAuth()
@Controller('inventario')
@UseGuards(JwtAuthGuard)
export class InventarioController {
  constructor(
    private readonly service: InventarioService,
    private readonly kardexService: KardexService,
  ) {}

  @Get('productos')
  @ApiOperation({ summary: 'Listar productos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllProductos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProductos(empresaId);
  }

  @Get('productos/buscar')
  @ApiOperation({ summary: 'Buscar productos por texto' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  searchProductos(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('q') termino: string,
  ) {
    return this.service.searchProductos(empresaId, termino);
  }

  @Get('tienda/productos')
  @Public()
  @ApiOperation({ summary: 'Productos para tienda virtual (con imagen y existencia). Público: sin sesión usa la empresa default' })
  @ApiResponse({ status: 200, description: 'Productos con imagen y stock' })
  findProductosTienda(
    @Query('empresaId') empresaId?: string,
    @Query('origen') origen?: string,
  ) {
    const emp = empresaId ? parseInt(empresaId, 10) : undefined;
    return this.service.findProductosTienda(emp, origen);
  }

  @Get('productos/paginado')
  @ApiOperation({ summary: 'Listar productos paginados' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllProductosPaginated(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAllProductosPaginated(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 25,
    );
  }

  @Get('productos/:id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findProducto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProducto(id, empresaId);
  }

  @Post('productos')
  @ApiOperation({ summary: 'Crear producto' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createProducto(@Body() dto: CreateProductoDto, @CurrentUser() user: any) {
    return this.service.createProducto(dto, user.usuario);
  }

  @Put('productos/:id')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateProducto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateProductoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProducto(id, empresaId, dto, user.usuario);
  }

  @Get('categorias')
  @Public()
  @ApiOperation({ summary: 'Listar categorías' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllCategorias(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCategorias(empresaId);
  }

  @Get('categorias/:id')
  @ApiOperation({ summary: 'Obtener categoría' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findCategoria(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCategoria(id, empresaId);
  }

  @Post('categorias')
  @ApiOperation({ summary: 'Crear categoría' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createCategoria(@Body() dto: CreateCategoriaDto, @CurrentUser() user: any) {
    return this.service.createCategoria(dto, user.usuario);
  }

  @Put('categorias/:id')
  @ApiOperation({ summary: 'Actualizar categoría' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateCategoria(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCategoriaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCategoria(id, empresaId, dto, user.usuario);
  }

  @Get('deptos')
  @Public()
  @ApiOperation({ summary: 'Listar departamentos de inventario' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllDeptos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDeptosInv(empresaId);
  }

  @Get('deptos/:id')
  @ApiOperation({ summary: 'Obtener departamento de inventario' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findDepto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDepto(id, empresaId);
  }

  @Post('deptos')
  @ApiOperation({ summary: 'Crear departamento de inventario' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createDepto(@Body() dto: CreateDeptoDto, @CurrentUser() user: any) {
    return this.service.createDepto(dto, user.usuario);
  }

  @Put('deptos/:id')
  @ApiOperation({ summary: 'Actualizar departamento de inventario' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateDepto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateDeptoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDepto(id, empresaId, dto, user.usuario);
  }

  @Get('marcas')
  @ApiOperation({ summary: 'Listar marcas' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllMarcas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMarcas(empresaId);
  }

  @Get('marcas/:id')
  @ApiOperation({ summary: 'Obtener marca' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findMarca(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMarca(id, empresaId);
  }

  @Post('marcas')
  @ApiOperation({ summary: 'Crear marca' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createMarca(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createMarca(dto, user.usuario);
  }

  @Put('marcas/:id')
  @ApiOperation({ summary: 'Actualizar marca' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateMarca(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMarca(id, empresaId, dto, user.usuario);
  }

  @Get('modelos')
  @ApiOperation({ summary: 'Listar modelos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllModelos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllModelos(empresaId);
  }

  @Get('modelos/:id')
  @ApiOperation({ summary: 'Obtener modelo' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findModelo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findModelo(id, empresaId);
  }

  @Post('modelos')
  @ApiOperation({ summary: 'Crear modelo' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createModelo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createModelo(dto, user.usuario);
  }

  @Put('modelos/:id')
  @ApiOperation({ summary: 'Actualizar modelo' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateModelo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateModelo(id, empresaId, dto, user.usuario);
  }

  @Get('colores')
  @ApiOperation({ summary: 'Listar colores' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllColores(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllColores(empresaId);
  }

  @Get('colores/:id')
  @ApiOperation({ summary: 'Obtener color' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findColor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findColor(id, empresaId);
  }

  @Post('colores')
  @ApiOperation({ summary: 'Crear color' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createColor(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createColor(dto, user.usuario);
  }

  @Put('colores/:id')
  @ApiOperation({ summary: 'Actualizar color' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateColor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateColor(id, empresaId, dto, user.usuario);
  }

  @Get('unidades-medida')
  @ApiOperation({ summary: 'Listar unidades de medida' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllUnidadesMedida(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllUnidadesMedida(empresaId);
  }

  @Get('unidades-medida/:id')
  @ApiOperation({ summary: 'Obtener unidad de medida' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findUnidadMedida(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findUnidadMedida(id, empresaId);
  }

  @Post('unidades-medida')
  @ApiOperation({ summary: 'Crear unidad de medida' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createUnidadMedida(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createUnidadMedida(dto, user.usuario);
  }

  @Put('unidades-medida/:id')
  @ApiOperation({ summary: 'Actualizar unidad de medida' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateUnidadMedida(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateUnidadMedida(id, empresaId, dto, user.usuario);
  }

  @Get('embalajes')
  @ApiOperation({ summary: 'Listar embalajes' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllEmbalajes(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllEmbalajes(empresaId);
  }

  @Get('embalajes/:id')
  @ApiOperation({ summary: 'Obtener embalaje' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findEmbalaje(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findEmbalaje(id, empresaId);
  }

  @Post('embalajes')
  @ApiOperation({ summary: 'Crear embalaje' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createEmbalaje(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createEmbalaje(dto, user.usuario);
  }

  @Put('embalajes/:id')
  @ApiOperation({ summary: 'Actualizar embalaje' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateEmbalaje(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateEmbalaje(id, empresaId, dto, user.usuario);
  }

  @Get('bodegas')
  @ApiOperation({ summary: 'Listar bodegas' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllBodegas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllBodegas(empresaId);
  }

  @Get('bodegas/:id')
  @ApiOperation({ summary: 'Obtener bodega' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findBodega(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findBodega(id, empresaId);
  }

  @Post('bodegas')
  @ApiOperation({ summary: 'Crear bodega' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createBodega(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createBodega(dto, user.usuario);
  }

  @Put('bodegas/:id')
  @ApiOperation({ summary: 'Actualizar bodega' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateBodega(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateBodega(id, empresaId, dto, user.usuario);
  }

  @Get('ubicaciones')
  @ApiOperation({ summary: 'Listar ubicaciones' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllUbicaciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllUbicaciones(empresaId);
  }

  @Get('ubicaciones/:id')
  @ApiOperation({ summary: 'Obtener ubicación' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findUbicacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findUbicacion(id, empresaId);
  }

  @Post('ubicaciones')
  @ApiOperation({ summary: 'Crear ubicación' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createUbicacion(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createUbicacion(dto, user.usuario);
  }

  @Put('ubicaciones/:id')
  @ApiOperation({ summary: 'Actualizar ubicación' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateUbicacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateUbicacion(id, empresaId, dto, user.usuario);
  }

  @Get('pasillos')
  @ApiOperation({ summary: 'Listar pasillos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllPasillos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPasillos(empresaId);
  }

  @Get('pasillos/:id')
  @ApiOperation({ summary: 'Obtener pasillo' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findPasillo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPasillo(id, empresaId);
  }

  @Post('pasillos')
  @ApiOperation({ summary: 'Crear pasillo' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createPasillo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPasillo(dto, user.usuario);
  }

  @Put('pasillos/:id')
  @ApiOperation({ summary: 'Actualizar pasillo' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updatePasillo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePasillo(id, empresaId, dto, user.usuario);
  }

  @Get('casas')
  @ApiOperation({ summary: 'Listar casas productoras' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllCasas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCasas(empresaId);
  }

  @Get('casas/:id')
  @ApiOperation({ summary: 'Obtener casa' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findCasa(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCasa(id, empresaId);
  }

  @Post('casas')
  @ApiOperation({ summary: 'Crear casa' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createCasa(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCasa(dto, user.usuario);
  }

  @Put('casas/:id')
  @ApiOperation({ summary: 'Actualizar casa' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateCasa(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCasa(id, empresaId, dto, user.usuario);
  }

  @Get('testantes')
  @ApiOperation({ summary: 'Listar testantes' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllTestantes(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTestantes(empresaId);
  }

  @Get('testantes/:id')
  @ApiOperation({ summary: 'Obtener testante' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findTestante(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTestante(id, empresaId);
  }

  @Post('testantes')
  @ApiOperation({ summary: 'Crear testante' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createTestante(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createTestante(dto, user.usuario);
  }

  @Put('testantes/:id')
  @ApiOperation({ summary: 'Actualizar testante' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateTestante(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTestante(id, empresaId, dto, user.usuario);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Listar tags' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllTags(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTags(empresaId);
  }

  @Get('tags/:id')
  @ApiOperation({ summary: 'Obtener tag' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findTag(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTag(id, empresaId);
  }

  @Post('tags')
  @ApiOperation({ summary: 'Crear tag' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createTag(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createTag(dto, user.usuario);
  }

  @Put('tags/:id')
  @ApiOperation({ summary: 'Actualizar tag' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateTag(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTag(id, empresaId, dto, user.usuario);
  }

  @Get('proveedores')
  @ApiOperation({ summary: 'Listar proveedores' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllProveedores(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProveedores(empresaId);
  }

  @Get('proveedores/dni-existe')
  @ApiOperation({ summary: 'Verificar si el DNI ya existe en proveedores de la empresa (llave maestra)' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  verificarDniProveedor(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('dni') dni: string,
    @Query('excluirId') excluirId?: string,
  ) {
    return this.service.verificarDniProveedor(empresaId, dni, excluirId ? Number(excluirId) : undefined);
  }

  @Get('proveedores/:id')
  @ApiOperation({ summary: 'Obtener proveedor' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findProveedor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProveedor(id, empresaId);
  }

  @Post('proveedores')
  @ApiOperation({ summary: 'Crear proveedor' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createProveedor(@Body() dto: CreateProveedorDto, @CurrentUser() user: any) {
    return this.service.createProveedor(dto, user.usuario);
  }

  @Put('proveedores/:id')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateProveedor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateProveedorDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProveedor(id, empresaId, dto, user.usuario);
  }

  @Get('existencias')
  @ApiOperation({ summary: 'Listar existencias por bodega' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllExistencias(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllExistencias(empresaId);
  }

  @Get('existencias/:id')
  @ApiOperation({ summary: 'Obtener existencia' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findExistencia(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findExistencia(id, empresaId);
  }

  @Get('kardex')
  @ApiOperation({ summary: 'Listar movimientos kardex' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllKardex(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllKardex(empresaId);
  }

  @Get('kardex/:id')
  @ApiOperation({ summary: 'Obtener movimiento kardex' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findKardex(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findKardex(id, empresaId);
  }

  @Get('kardex/consulta')
  @ApiOperation({ summary: 'Consultar kardex con filtros' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  consultarKardex(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('bodegaId') bodegaId?: string,
    @Query('productoId') productoId?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('tipomov') tipomov?: 'E' | 'S',
    @Query('moduloId') moduloId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.kardexService.consultarKardex({
      empresaId,
      bodegaId: bodegaId ? parseInt(bodegaId, 10) : undefined,
      productoId: productoId ? parseInt(productoId, 10) : undefined,
      fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
      fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
      tipomov,
      moduloId: moduloId ? parseInt(moduloId, 10) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('kardex/saldo/:bodegaId/:productoId')
  @ApiOperation({ summary: 'Obtener saldo actual de producto en bodega' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  obtenerSaldo(
    @Param('bodegaId', ParseIntPipe) bodegaId: number,
    @Param('productoId', ParseIntPipe) productoId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.kardexService.obtenerSaldoActual(bodegaId, productoId, empresaId);
  }

  @Post('kardex/entrada')
  @ApiOperation({ summary: 'Registrar entrada de inventario' })
  @ApiResponse({ status: 201, description: 'Creado' })
  registrarEntrada(@Body() dto: KardexEntradaDto, @CurrentUser() user: any) {
    return this.kardexService.registrarEntrada({ ...dto, usuarioCreated: user.usuario });
  }

  @Post('kardex/salida')
  @ApiOperation({ summary: 'Registrar salida de inventario' })
  @ApiResponse({ status: 201, description: 'Creado' })
  registrarSalida(@Body() dto: KardexSalidaDto, @CurrentUser() user: any) {
    return this.kardexService.registrarSalida({ ...dto, usuarioCreated: user.usuario });
  }

  @Post('kardex/recalcular')
  @ApiOperation({ summary: 'Recalcular existencias desde kardex (herramienta de mantenimiento)' })
  @ApiResponse({ status: 200, description: 'Existencias recalculadas' })
  recalcularExistencias(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('stockInicial') stockInicial?: string,
  ) {
    return this.kardexService.recalcularExistencias(empresaId, stockInicial ? Number(stockInicial) : 100);
  }

  // ===== ProductoCodBarra =====

  @Get('codigos-barras')
  @ApiOperation({ summary: 'Listar códigos de barras' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllCodBarra(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCodBarra(empresaId);
  }

  @Get('codigos-barras/:id')
  @ApiOperation({ summary: 'Obtener código de barras' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findCodBarra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCodBarra(id, empresaId);
  }

  @Post('codigos-barras')
  @ApiOperation({ summary: 'Crear código de barras' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createCodBarra(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCodBarra(dto, user.usuario);
  }

  @Put('codigos-barras/:id')
  @ApiOperation({ summary: 'Actualizar código de barras' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateCodBarra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCodBarra(id, empresaId, dto, user.usuario);
  }

  @Delete('codigos-barras/:id')
  @ApiOperation({ summary: 'Eliminar código de barras' })
  @ApiResponse({ status: 200, description: 'Eliminado' })
  removeCodBarra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCodBarra(id, empresaId);
  }

  // ===== ProductoDet =====

  @Get('productos-det')
  @ApiOperation({ summary: 'Listar detalle de productos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllProdDet(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('produtoId') produtoId?: string,
  ) {
    return this.service.findAllProdDet(empresaId, produtoId ? Number(produtoId) : undefined);
  }

  @Get('productos-det/:id')
  @ApiOperation({ summary: 'Obtener detalle de producto' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findProdDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProdDet(id, empresaId);
  }

  @Post('productos-det')
  @ApiOperation({ summary: 'Crear detalle de producto' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createProdDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createProdDet(dto, user.usuario);
  }

  @Put('productos-det/:id')
  @ApiOperation({ summary: 'Actualizar detalle de producto' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateProdDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProdDet(id, empresaId, dto, user.usuario);
  }

  @Delete('productos-det/:id')
  @ApiOperation({ summary: 'Eliminar detalle de producto' })
  @ApiResponse({ status: 200, description: 'Eliminado' })
  removeProdDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeProdDet(id, empresaId);
  }

  // ===== ProductoImg =====

  @Get('productos-img')
  @Public()
  @ApiOperation({ summary: 'Listar imágenes de productos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllProdImg(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('productoId') productoId?: string,
  ) {
    return this.service.findAllProdImg(empresaId, productoId ? Number(productoId) : undefined);
  }

  @Get('productos-img/:id')
  @ApiOperation({ summary: 'Obtener imagen de producto' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findProdImg(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProdImg(id, empresaId);
  }

  @Post('productos-img')
  @ApiOperation({ summary: 'Crear imagen de producto' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createProdImg(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createProdImg(dto, user.usuario);
  }

  @Put('productos-img/:id')
  @ApiOperation({ summary: 'Actualizar imagen de producto' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateProdImg(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProdImg(id, empresaId, dto, user.usuario);
  }

  @Delete('productos-img/:id')
  @ApiOperation({ summary: 'Eliminar imagen de producto' })
  @ApiResponse({ status: 200, description: 'Eliminado' })
  removeProdImg(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeProdImg(id, empresaId);
  }

  @Post('ajustes/positivo')
  @ApiOperation({ summary: 'Registrar ajuste positivo de inventario' })
  @ApiResponse({ status: 201, description: 'Creado' })
  registrarAjustePositivo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.registrarAjustePositivo({ ...dto, usuarioCreated: user.usuario });
  }

  @Post('ajustes/negativo')
  @ApiOperation({ summary: 'Registrar ajuste negativo de inventario' })
  @ApiResponse({ status: 201, description: 'Creado' })
  registrarAjusteNegativo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.registrarAjusteNegativo({ ...dto, usuarioCreated: user.usuario });
  }

  @Post('traslados')
  @ApiOperation({ summary: 'Registrar traslado entre bodegas' })
  @ApiResponse({ status: 201, description: 'Creado' })
  registrarTraslado(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.registrarTraslado({ ...dto, usuarioCreated: user.usuario });
  }
}
