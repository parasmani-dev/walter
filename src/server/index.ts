import express from "express";
import scanRouter from "./routes/scan";

const app = express();
app.use(express.json());

app.use("/scan", scanRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Walter Backend] API Server running on port ${PORT}`);
});
