import express from "express";
import { listStocks, getStockBySymbol, searchStocks } from "../controllers/stocks.controller";

const router = express.Router();

router.get("/search", searchStocks);
router.get("/", listStocks);
router.get("/:symbol", getStockBySymbol);

export default router;
