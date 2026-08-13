import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes.js";
import groupRoutes from "./modules/groups/groups.routes.js";
import expenseRoutes from "./modules/expenses/expenses.routes.js";
import settlementRoutes from "./modules/settlements/settlements.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/settlements", settlementRoutes);

app.get("/", (_req, res) => {
  res.send("Splitlyy API is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});