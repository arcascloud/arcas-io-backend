# Backend — API Documentation

NestJS backend corriendo en `http://localhost:3000/api`.

## Autenticación

- **POST** `/api/auth/login` — `{ usuario, password }` → `{ access_token, usuario }`
- Todos los demás endpoints requieren header `Authorization: Bearer <token>`
- El JWT payload contiene `usuario`, `empresaId`
- `empresaId` se inyecta automáticamente via query param en GET/PUT/DELETE y via body en POST/PUT

## Arquitectura general

### Patrón por módulo
Cada módulo tiene:
- `*.entity.ts` — Entidad TypeORM (tabla MySQL)
- `*.dto.ts` — DTOs de validación (solo algunos módulos)
- `*.service.ts` — Lógica de negocio
- `*.controller.ts` — Endpoints REST
- `*.module.ts` — Definición del módulo NestJS

### Patrones de negocio
| Patrón | Módulos | Descripción |
|--------|---------|-------------|
| **CRUD genérico** | bancos, companies, contabilidad, cxp, facturacion, inventario, parametros, planilla, sucursales, users | GET all, GET one, POST, PUT |
| **Maestro-Detalle** | facturacion, cxc/caja, cxp | Header + detail rows (mae + det) |
| **CxC custom** | cxc | Clientes, movimientos, saldos, caja, préstamos |

### Inyección de contexto
- `empresaId` — Se inyecta automáticamente en todos los endpoints autenticados
- `Idsucursal` — Se inyecta solo para rutas en `ApiService.CON_SUCURSAL`
- `usuario` — Se obtiene del JWT via `@CurrentUser()`

---

## Módulos y Endpoints

### 1. Auth (`/api/auth`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Login, retorna JWT |

### 2. Users (`/api/users`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/users` | Listar usuarios |
| GET | `/users/:usuario` | Obtener usuario |
| POST | `/users` | Crear usuario |
| PUT | `/users/:usuario` | Actualizar usuario |
| GET/POST/PUT/DELETE | `/users/modules/*` | CRUD módulos |
| GET/POST/PUT/DELETE | `/users/menu-items/*` | CRUD items de menú |
| GET/POST/PUT/DELETE | `/users/scripts/*` | CRUD scripts |
| GET/POST/PUT/DELETE | `/users/mod-auth/*` | CRUD autorización de módulos |

**Entidades:** `tusuarios`, `tusuariosmodule`, `tusuariomnuitem`, `tusuariosscripts`, `usuariomodauth`

### 3. Companies (`/api/companies`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST/PUT | `/companies` | CRUD empresas |

**Entidad:** `tempresas`

### 4. Sucursales (`/api/sucursales`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST/PUT | `/sucursales` | CRUD sucursales |

**Entidad:** `tsucursal`

### 5. Parámetros (`/api/parametros`)

Catálogos del sistema. Cada endpoint es un catálogo independiente.

| Ruta | Tabla | Descripción |
|------|-------|-------------|
| `/parametros/tcotipodocumentofiscal` | `tcotipodocumentofiscal` | Tipos de documento fiscal (FAC, NDB, NCR, PRE) |
| `/parametros/monedas` | `ttipomonedas` | Monedas |
| `/parametros/paises` | `ttipopais` | Países |
| `/parametros/departamentos-pais` | `ttipodeptopais` | Departamentos por país |
| `/parametros/departamentos-empresa` | `ttipodeptoempresa` | Departamentos empresa |
| `/parametros/direcciones` | `ttipodirecciones` | Tipos de dirección |
| `/parametros/estados` | `ttipoestado` | Estados |
| `/parametros/formas-pago` | `ttipoformapago` | Formas de pago (Efectivo, Tarjeta, etc.) |
| `/parametros/telefonos` | `ttipotelefono` | Tipos de teléfono |
| `/parametros/tarjetas-credito` | `ttipotarjetacredito` | Tarjetas de crédito |
| `/parametros/pasatiempos` | `ttipopasatiempos` | Pasatiempos |
| `/parametros/zonas` | `ttipozonas` | Zonas |
| `/parametros/gestores` | `ttipogestores` | Gestores de cobro |
| `/parametros/impuestos` | `ttipoimpuestos` | Impuestos |
| `/parametros/proformas` | `ttipoproforma` | Proformas |
| `/parametros/zonas-vta-cob` | `ttipozonasvtacob` | Zonas de venta/cobro |
| `/parametros/param-bco` | `ttipoparambco` | Parámetros bancos (upsert) |
| `/parametros/param-con` | `ttipoparamcon` | Parámetros contabilidad (upsert) |
| `/parametros/param-cxc` | `ttipoparamcxc` | Parámetros CxC (upsert) |
| `/parametros/param-cxp` | `ttipoparamcxp` | Parámetros CxP (upsert) |
| `/parametros/param-fac` | `ttipoparamfac` | Parámetros facturación (upsert) |
| `/parametros/param-inv` | `ttipoparaminv` | Parámetros inventario (upsert) |
| `/parametros/param-pap` | `ttipoparampap` | Parámetros papelería (upsert) |
| `/parametros/param-pla` | `ttipoparampla` | Parámetros planilla (upsert) |
| `/parametros/param-pres` | `ttipoparampres` | Parámetros presupuesto (upsert) |

Cada catálogo tiene: `GET /`, `GET /:id`, `POST /`, `PUT /:id`

### 6. Contabilidad (`/api/contabilidad`)

Módulo contable. CRUD genérico para cada tabla.

| Ruta | Tabla | Descripción |
|------|-------|-------------|
| `/contabilidad/ctacontables` | `tcoctacontables` | Plan de cuentas |
| `/contabilidad/grupocontable` | `tcogrupocontable` | Grupos contables |
| `/contabilidad/plantillapdamae` | `tcoplantillapdamae` | Plantilla partida doble (maestro) |
| `/contabilidad/plantillapdadet` | `tcoplantillapdadet` | Plantilla partida doble (detalle) |
| `/contabilidad/saldoscta` | `cosaldoscta` | Saldos de cuentas |
| `/contabilidad/cierrectable` | `cocierrectable` | Cierre de tabla |
| `/contabilidad/repliquidez` | `tcorepliquidez` | Reporte de liquidez |
| `/contabilidad/factordecambio` | `cofactordecambios` | Factor de cambio (dólar) |
| `/contabilidad/plantillabalancesmae` | `tcoplantillabalancesmae` | Plantilla balance (maestro) |
| `/contabilidad/plantillabalancesdet` | `tcoplantillabalancesdet` | Plantilla balance (detalle) |
| `/contabilidad/repdiarios` | `tcorepdiarios` | Reporte diarios |
| `/contabilidad/repbalances` | `tcorepbalances` | Reporte balances |
| `/contabilidad/periodoctable` | `coperiodoctable` | Periodos contables |
| `/contabilidad/copdamae` | `copdamae` | Comprobante diario (maestro) |
| `/contabilidad/copdadet` | `copdadet` | Comprobante diario (detalle) |
| `/contabilidad/movcta` | `comovcta` | Movimiento de cuentas |
| `/contabilidad/nivelcta` | `tconivelcta` | Niveles de cuenta |
| `/contabilidad/naturalezacta` | `tconaturalezacta` | Naturaleza de cuenta |
| `/contabilidad/impuestovecinal` | `tcoimpuestovecinal` | Impuesto vecinal |
| `/contabilidad/tipos-doc-fiscal` | `tcotipodocumentofiscal` | Tipos de documento fiscal |

Notas:
- Los endpoints de contabilidad usan el prefijo `/api/contabilidad/` (no `/api/parametros/`)
- `PUT .../id/remove` = soft delete (set `sn_activo = 'N'`)
- `copdamae` y `copdadet` están en `CON_SUCURSAL`

### 7. CxC — Cuentas por Cobrar (`/api/cxc`)

**Más detallado abajo en la sección CxC.**

### 8. CxP — Cuentas por Pagar (`/api/cxp`)

| Ruta | Tabla | Descripción |
|------|-------|-------------|
| `/cxp/proveedores` | `proveedor` | Proveedores |
| `/cxp/proveedores-dir` | `proveedordir` | Direcciones proveedor |
| `/cxp/proveedores-tel` | `proveedortel` | Teléfonos proveedor |
| `/cxp/compras` | `cxpcomprasmae` | Compras (maestro) |
| `/cxp/compras-det` | `cxpcomprasdet` | Compras (detalle) |
| `/cxp/movimientos` | `cxpmovimientos` | Movimientos CxP |
| `/cxp/historicos` | `cxphisto` | Histórico CxP |
| `/cxp/saldos-av` | `cxpsalfav` | Saldos a favor |

### 9. Facturación (`/api/facturacion`)

| Ruta | Tabla | Descripción |
|------|-------|-------------|
| `/facturacion/correlativos` | `poscorrelativos` | Correlativos de facturación |
| `/facturacion/facturas` | `posfacmae` | Facturas (maestro) |
| `/facturacion/facturas-det` | `posfacdet` | Facturas (detalle) |
| `/facturacion/facturas-anul` | `posfacmaeanul` | Facturas anuladas |
| `/facturacion/facturas-det-anul` | `posfacdetanul` | Detalle facturas anuladas |
| `/facturacion/cotizaciones` | `poscotmae` | Cotizaciones (maestro) |
| `/facturacion/cotizaciones-det` | `poscotdet` | Cotizaciones (detalle) |
| `/facturacion/pedidos` | `pospedmae` | Pedidos (maestro) |
| `/facturacion/pedidos-det` | `pospeddet` | Pedidos (detalle) |
| `/facturacion/combos` | `poscbomae` | Combos (maestro) |
| `/facturacion/combos-det` | `poscbodet` | Combos (detalle) |
| `/facturacion/precios` | `tpospreciovtas` | Lista de precios |
| `/facturacion/descuentos` | `tposdescuentos` | Descuentos |

### 10. Inventario (`/api/inventario`)

| Ruta | Tabla | Descripción |
|------|-------|-------------|
| `/inventario/productos` | `productos` | Productos |
| `/inventario/productos/buscar` | — | Búsqueda por texto |
| `/inventario/productos/paginado` | — | Listado paginado |
| `/inventario/productos-det` | `productosdet` | Detalle de producto |
| `/inventario/productos-img` | `productoimg` | Imágenes de producto |
| `/inventario/codigos-barras` | `productocodbarras` | Códigos de barras |
| `/inventario/categorias` | `tinvcategoria` | Categorías |
| `/inventario/marcas` | `tinvmarcas` | Marcas |
| `/inventario/modelos` | `tinvmodelos` | Modelos |
| `/inventario/colores` | `tinvcolores` | Colores |
| `/inventario/unidades-medida` | `tinvunidadmedida` | Unidades de medida |
| `/inventario/embalajes` | `tinvembalajes` | Embalajes |
| `/inventario/bodegas` | `tinvbodegas` | Bodegas |
| `/inventario/ubicaciones` | `tinvubicaciones` | Ubicaciones |
| `/inventario/pasillos` | `tinvpasillos` | Pasillos |
| `/inventario/casas` | `tinvcasas` | Casas (productoras) |
| `/inventario/testantes` | `tinvestantes` | Testantes |
| `/inventario/tags` | `tinvtags` | Tags |
| `/inventario/proveedores` | `proveedor` | Proveedores inventario |
| `/inventario/existencias` | `invexistencias` | Existencias por bodega |
| `/inventario/kardex` | `invkardex` | Kardex (movimientos inventario) |
| `/inventario/kardex/consulta` | — | Consulta de kardex |
| `/inventario/kardex/saldo/:bodegaId/:productoId` | — | Saldo actual |
| `/inventario/kardex/entrada` | — | Entrada de inventario |
| `/inventario/kardex/salida` | — | Salida de inventario |
| `/inventario/ajustes/positivo` | — | Ajuste positivo |
| `/inventario/ajustes/negativo` | — | Ajuste negativo |
| `/inventario/traslados` | — | Traslado entre bodegas |

Nota: El módulo inventario usa 2 services: `InventarioService` + `KardexService`

### 11. Bancos (`/api/bancos`)

| Ruta | Tabla | Descripción |
|------|-------|-------------|
| `/bancos/bancos` | `bcos` | Bancos |
| `/bancos/cuentas` | `bcosctas` | Cuentas bancarias |
| `/bancos/conciliaciones` | `bcosccmae` | Conciliaciones |
| `/bancos/direcciones` | `bcosdir` | Direcciones banco |
| `/bancos/telefonos` | `bcostel` | Teléfonos banco |

### 12. Planilla (`/api/planilla`)

| Ruta | Tabla | Descripción |
|------|-------|-------------|
| `/planilla/empleados` | `plplempleados` | Empleados |
| `/planilla/titulaciones` | `pletitulaciones` | Titulaciones |
| `/planilla/asistencia` | `pleasistencia` | Control de asistencia |
| `/planilla/certificaciones` | `plecertificaciones` | Certificaciones |
| `/planilla/comisiones` | `plecomisiones` | Comisiones |
| `/planilla/deducciones-emp` | `plededucciones` | Deducciones por empleado |
| `/planilla/planillas` | `pleplamae` | Planillas (maestro) |
| `/planilla/planilla-det` | `plepladet` | Planillas (detalle) |
| `/planilla/puestos` | `tplpuestos` | Puestos |
| `/planilla/profesiones` | `tplprofesiones` | Profesiones |
| `/planilla/deducciones` | `tpldeducciones` | Catálogo deducciones |
| `/planilla/ingresos` | `tplingresos` | Catálogo ingresos |

### 13. Módulos del sistema (`/api/modulos`)

| Ruta | Tabla | Descripción |
|------|-------|-------------|
| `/modulos` | `tmodulos` | CRUD de módulos del sistema |

---

## CxC — Detalle completo (`/api/cxc`)

### Entidades (14 tablas)

| Entidad | Tabla | Descripción |
|---------|-------|-------------|
| `CxcCliente` | `cxcclientes` | Clientes CxC |
| `CxccClientesDir` | `cxccclientesdir` | Direcciones de cliente |
| `CxcClienteTel` | `cxcclientestel` | Teléfonos de cliente |
| `CxccClientesRef` | `cxccclientesref` | Referencias personales |
| `Cxccajero` | `cxccajeros` | Cajeros (cajero por usuario) |
| `CxccajaMae` | `cxccajamae` | Caja maestro (cabecera de pago) |
| `CxccajaDet` | `cxccajadet` | Caja detalle (desglose por forma de pago) |
| `CxcMovimiento` | `cxcmovimientos` | Movimientos (débitos y créditos) |
| `CxcHistoro` | `cxchisto` | Histórico de clientes |
| `CxcSalFav` | `cxcsalfav` | Saldos a favor |
| `TcctDiasCobro` | `tcctdiascobros` | Días de cobro |
| `CxcPrestamo` | `cxcprestamos` | Préstamos |
| `CxcPrestamoPP` | `cxcprestamospp` | Plan de pagos de préstamos |
| `CxcPariente` | `cxcparientes` | Parientes de cliente |

### Endpoints

#### Clientes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/cxc/clientes?empresaId=&page=&limit=&q=` | Listar con paginación y búsqueda |
| GET | `/cxc/clientes/:id?empresaId=` | Obtener cliente |
| POST | `/cxc/clientes` | Crear cliente |
| PUT | `/cxc/clientes/:id?empresaId=` | Actualizar cliente |
| GET | `/cxc/clientes-dir?empresaId=` | Direcciones de clientes |
| GET | `/cxc/clientes-dir/:id?empresaId=` | Dirección específica |
| POST | `/cxc/clientes-dir` | Crear dirección |
| PUT | `/cxc/clientes-dir/:id?empresaId=` | Actualizar dirección |
| GET | `/cxc/clientes-tel?empresaId=` | Teléfonos de clientes |
| GET | `/cxc/clientes-tel/:id?empresaId=` | Teléfono específico |
| POST | `/cxc/clientes-tel` | Crear teléfono |
| PUT | `/cxc/clientes-tel/:id?empresaId=` | Actualizar teléfono |
| GET | `/cxc/clientes-ref?empresaId=` | Referencias de clientes |
| GET | `/cxc/clientes-ref/cliente/:clienteId?empresaId=` | Referencias por cliente |
| GET | `/cxc/clientes-ref/:id?empresaId=` | Referencia específica |
| POST | `/cxc/clientes-ref` | Crear referencia |
| PUT | `/cxc/clientes-ref/:id?empresaId=` | Actualizar referencia |

#### Cajeros
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/cxc/cajeros?empresaId=` | Listar cajeros |
| GET | `/cxc/cajeros/:id?empresaId=` | Obtener cajero |
| POST | `/cxc/cajeros` | Crear cajero |
| PUT | `/cxc/cajeros/:id?empresaId=` | Actualizar cajero |

Nota: `cxccajeros.usuario` vincula al usuario logueado. Se usa para asignar `cajaId` en detalles de caja.

#### Caja (Maestro-Detalle)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/cxc/caja-mae?empresaId=` | Listar cabeceras de caja |
| GET | `/cxc/caja-mae/:id?empresaId=` | Obtener cabecera |
| POST | `/cxc/caja-mae` | Crear cabecera de pago |
| PUT | `/cxc/caja-mae/:id?empresaId=` | Actualizar cabecera |
| GET | `/cxc/caja-det?empresaId=` | Listar detalles de caja |
| GET | `/cxc/caja-det/:id?empresaId=` | Obtener detalle |
| POST | `/cxc/caja-det` | Crear detalle (auto-inyecta `cajaId`, `clienteId`, `nrocliente` desde maestro) |
| PUT | `/cxc/caja-det/:id?empresaId=` | Actualizar detalle |

**Flujo de guardado caja:**
1. `POST /cxc/caja-mae` → crea cabecera → genera movimiento con `importe: 0`
2. `POST /cxc/caja-det` × N → crea cada detalle → genera movimiento con importe real por cada fila

**Campos auto-inyectados en `createCajaDet`:**
- `cajaId` — Se busca por `cxccajeros.usuario = currentUser`
- `clienteId` — Se copia desde `cxccajamae.clienteId`
- `nrocliente` — Se copia desde `cxccajamae.nrocliente`

#### Movimientos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/cxc/movimientos?empresaId=` | Listar todos |
| GET | `/cxc/movimientos/cliente/:clienteId?empresaId=` | Movimientos por cliente |
| GET | `/cxc/movimientos/:id?empresaId=` | Obtener movimiento |
| POST | `/cxc/movimientos` | Crear movimiento |
| PUT | `/cxc/movimientos/:id?empresaId=` | Actualizar movimiento |

**Campos de `cxcmovimientos`:**
- `tipomov`: `'D'` (Débito/deuda) o `'C'` (Crédito/pago)
- `moduloId`: 1=facturación, 4=CxC
- `documentoId`: FK a `tcotipodocumentofiscal` (NO es el ID del documento, es el TIPO)
- `nroreferencia`: Número de referencia del documento (factura #, NDB #, etc.)

#### Préstamos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/cxc/prestamos?empresaId=` | Listar préstamos |
| GET | `/cxc/prestamos/cliente/:clienteId?empresaId=` | Por cliente |
| GET | `/cxc/prestamos/:id?empresaId=` | Obtener préstamo |
| POST | `/cxc/prestamos` | Crear préstamo |
| PUT | `/cxc/prestamos/:id?empresaId=` | Actualizar préstamo |
| GET | `/cxc/prestamo-pp?empresaId=` | Plan de pagos |
| GET | `/cxc/prestamo-pp/:id?empresaId=` | Cuota específica |
| POST | `/cxc/prestamo-pp` | Crear cuota |
| PUT | `/cxc/prestamo-pp/:id?empresaId=` | Actualizar cuota |

#### Parientes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/cxc/parientes?empresaId=` | Listar |
| GET | `/cxc/parientes/cliente/:clienteId?empresaId=` | Por cliente |
| POST | `/cxc/parientes` | Crear |
| PUT | `/cxc/parientes/:id?empresaId=` | Actualizar |

#### Consultas especiales
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/cxc/antiguedad-saldos?empresaId=` | Antigüedad de saldos (corriente, 30, 60, 90+ días) |
| GET | `/cxc/clientes-con-saldo?empresaId=` | Clientes con saldo pendiente + dirección + teléfono |
| GET | `/cxc/documentos-pendientes/cliente/:clienteId?empresaId=` | Documentos con saldo por cliente |

**`documentos-pendientes` lógica:**
- 1ra pasada: acumula débitos (D) agrupados por `moduloId-nroreferencia`
- 2da pasada: resta créditos (C) por `nroreferencia`
- Retorna documentos con saldo > 0

#### Otros
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/cxc/historico?empresaId=` | Histórico |
| GET | `/cxc/historico/cliente/:clienteId?empresaId=` | Histórico por cliente |
| POST | `/cxc/historico` | Crear |
| GET | `/cxc/saldo-favor?empresaId=` | Saldos a favor |
| POST | `/cxc/saldo-favor` | Crear |
| GET | `/cxc/dias-cobro?empresaId=` | Días de cobro |
| POST | `/cxc/dias-cobro` | Crear |

---

## Módulos del sistema (`/api/modulos`)

| Ruta | Tabla | Descripción |
|------|-------|-------------|
| `/modulos` | `tmodulos` | CRUD de módulos |

---

## Base de datos

### Tablas principales por esquema conceptual

| Esquema | Tablas | Módulo |
|---------|--------|--------|
| **Seguridad** | `tusuarios`, `tusuariosmodule`, `tusuariomnuitem`, `usuariomodauth`, `tmodulos`, `tempresas`, `tsucursal` | users, modules, companies, sucursales |
| **Catálogos** | `ttipomonedas`, `ttipopais`, `ttipoformapago`, `ttipotarjetacredito`, `ttipoimpuestos`, `tcotipodocumentofiscal`, etc. (24 tablas) | parametros |
| **Inventario** | `productos`, `productosdet`, `productoimg`, `productocodbarras`, `tinvcategoria`, `tinvmarcas`, `tinvbodegas`, `invexistencias`, `invkardex`, etc. (19 tablas) | inventario |
| **Facturación** | `posfacmae`, `posfacdet`, `poscotmae`, `pospedmae`, `poscorrelativos`, etc. (13 tablas) | facturacion |
| **CxC** | `cxcclientes`, `cxccajamae`, `cxccajadet`, `cxcmovimientos`, `cxcprestamos`, etc. (14 tablas) | cxc |
| **CxP** | `proveedor`, `cxpcomprasmae`, `cxpcomprasdet`, `cxpmovimientos`, etc. (8 tablas) | cxp |
| **Contabilidad** | `tcoctacontables`, `copdamae`, `copdadet`, `cofactordecambios`, etc. (16+ tablas) | contabilidad |
| **Bancos** | `bcos`, `bcosctas`, `bcosccmae`, etc. (6 tablas) | bancos |
| **Planilla** | `plplempleados`, `pleplamae`, `plepladet`, `tplpuestos`, etc. (11 tablas) | planilla |

### Prefijos de tablas (legacy)
| Prefijo | Significado | Módulos |
|---------|-------------|---------|
| `t` | Tipo/catálogo | parametros, contabilidad, planilla |
| `tinv` | Inventario | inventario |
| `tpl` | Planilla | planilla |
| `tco` | Contabilidad | contabilidad |
| `ttipo` | Catálogo de parámetros | parametros |
| `pos` | Punto de venta | facturacion |
| `bcos` | Bancos | bancos |
| `ple` | Planilla/empleado | planilla |
| `cxc` | Cuentas por cobrar | cxc |
| `cxp` | Cuentas por pagar | cxp |
| `co` | Contabilidad | contabilidad |
| `inv` | Inventario | inventario |
| `plp` | Planilla/puestos | planilla |
