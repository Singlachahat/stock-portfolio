import express from "express";
import { getMyPortfolio, updatePortfolio } from "../controllers/portfolio.controller";
import {
  getHoldings,
  addHolding,
  updateHolding,
  deleteHolding,
} from "../controllers/holdings.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/me", authMiddleware, getMyPortfolio);
router.patch("/me", authMiddleware, updatePortfolio);

router.get("/me/holdings", authMiddleware, getHoldings);
router.post("/me/holdings", authMiddleware, addHolding);
router.patch("/me/holdings/:holdingId", authMiddleware, updateHolding);
router.delete("/me/holdings/:holdingId", authMiddleware, deleteHolding);

export default router;
