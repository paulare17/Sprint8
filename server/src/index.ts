import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URL || "")
  .then(() => console.log("Connectat a MongoDB"))
  .catch((err) => console.error("Error MongoDB:", err));

app.get("/", (_req, res) => {
  res.send("Servidor actiu");
});

app.listen(PORT, () => console.log(`Servidor escoltant al port ${PORT}`));