import { Router, type IRouter } from "express";
import healthRouter from "./health";
import challengesRouter from "./challenges";
import dailyPlanRouter from "./daily-plan";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(challengesRouter);
router.use(dailyPlanRouter);
router.use(authRouter);

export default router;
