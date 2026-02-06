import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes";
import portfolioRoutes from "./routes/portfolio.routes";
import stocksRoutes from "./routes/stocks.routes";
import marketRoutes from "./routes/market.routes";

const app = express();

app.use(cors({ origin: "*" }));

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/portfolios", portfolioRoutes);
app.use("/api/stocks", stocksRoutes);
app.use("/api/market", marketRoutes);

app.get("/", (_req, res) => {
  res.send("Backend running 🚀");
});

app.get("/health", (_req, res) => {
  res.send("API running");
});
export default app;
