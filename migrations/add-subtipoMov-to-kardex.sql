-- Migración: Agregar subtipoMov a invkardex
-- Ejecutar en la base de datos arcasdb

USE `arcasdb`;

-- Agregar columna subtipoMov
ALTER TABLE `invkardex` 
ADD COLUMN `subtipoMov` VARCHAR(2) NOT NULL DEFAULT 'O' 
COMMENT 'Subtipo de movimiento: C=Compra, V=Venta, A=Ajuste, T=Traslado, AN=Anulacion, D=Devolucion, O=Otro'
AFTER `tipomov`;

-- Crear índice para consultas por subtipo
CREATE INDEX `idx_invkardex_subtipoMov` ON `invkardex` (`subtipoMov`);

-- Actualizar registros existentes basado en moduloId
UPDATE `invkardex` SET `subtipoMov` = 
  CASE 
    WHEN `moduloId` = 1 THEN 'V'   -- Facturacion = Ventas
    WHEN `moduloId` = 2 THEN 'C'   -- CXP/Compras = Compras
    WHEN `moduloId` = 3 THEN 'A'   -- CXC/Caja = Abono/Pago (ajuste)
    WHEN `moduloId` = 4 THEN 'A'   -- Inventario = Ajuste
    ELSE 'O'
  END
WHERE `subtipoMov` = 'O';