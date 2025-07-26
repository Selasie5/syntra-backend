import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Example test route
app.get("/", (req, res) => {
  res.send("Syntra backend is running 🚀");
});

// TODO: mount routes for /api/slack, /api/agent, etc.

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
