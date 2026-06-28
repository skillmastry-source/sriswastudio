import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import storageRouter from "./storage";
import siteDesignRouter from "./site-design";
import paymentsRouter from "./payments";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(storageRouter);
// site-design must be registered BEFORE adminRouter — adminRouter has a global
// requireAdmin guard that would otherwise intercept unauthenticated requests to
// the public GET /api/site-design before they ever reach this router.
router.use(siteDesignRouter);
// payments must also be before adminRouter for same reason
router.use(paymentsRouter);
router.use(adminRouter);

export default router;
