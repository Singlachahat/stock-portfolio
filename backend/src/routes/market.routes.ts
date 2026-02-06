import express from "express";
import { refreshMarket, getQuote } from "../controllers/market.controller";

const router = express.Router();

router.get("/quote", getQuote);
router.post("/refresh", refreshMarket);

export default router;
