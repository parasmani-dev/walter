import "dotenv/config";
import express from "express";
import cors from "cors";
import scanRouter from "./routes/scan";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/scan", scanRouter);

app.get("/health", (req, res) => res.status(200).send("ok"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Walter Backend] API Server running on port ${PORT}`);
});
