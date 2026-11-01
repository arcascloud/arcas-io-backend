import { Router } from "express";
import {
  generarLink,
  confirmarPago,
  webhook,
  consultarStatus,
  listarTransacciones,
  getConfig,
} from "../controllers/todopagoController.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

// Público — sin autenticación
router.get("/config", getConfig);
router.post("/webhook", webhook);
router.post("/confirmar", confirmarPago);

// Rutas protegidas
router.use(authRequired);

router.post("/generar-link/:factura_id", generarLink);
router.get("/status/:operation_id", consultarStatus);
router.get("/transacciones/:factura_id", listarTransacciones);

export default router;
