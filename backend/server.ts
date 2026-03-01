import cors from "cors";
import "dotenv/config";
import express from "express";
import apiRoutes from "./routes/api";
import { seedStore } from "./seed";

const app = express();
const port = Number(process.env.PORT ?? 4000);

seedStore();

app.use(cors());
app.use(express.json());
app.use(apiRoutes);

app.get("/", (_req, res) => {
  res.json({ ok: true });
});


app.listen(port, () => {
  console.log(`Learning Twin backend running on http://localhost:${port}`);
});
