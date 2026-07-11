import { Router, type IRouter } from "express";
import healthRouter from "./health";
import challengesRouter from "./challenges";

const router: IRouter = Router();

router.use(healthRouter);
router.use(challengesRouter);

export default router;
