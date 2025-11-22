// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import emailRoutes from "./routes/emailRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Root Test Endpoint
app.get("/", (req, res) => {
  res.send("Backend running + SendGrid active");
});

// Mount Email Routes (VERY IMPORTANT)
app.use("/api", emailRoutes);

// Server
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
