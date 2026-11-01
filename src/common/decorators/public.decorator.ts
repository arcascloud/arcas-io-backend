import { SetMetadata } from '@nestjs/common';

/** Clave de metadata para rutas públicas (sin JWT). */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un handler o controller como PÚBLICO: el `JwtAuthGuard` lo exime
 * de la autenticación (el registro público y los catálogos geográficos
 * del formulario de registro no tienen sesión).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
