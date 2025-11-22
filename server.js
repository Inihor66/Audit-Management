// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import emailRoutes from "./routes/emailRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ROOT CHECK
app.get("/", (req, res) => {
  res.send("Audit App Backend Running");
});

// EMAIL ROUTES
app.use("/api", emailRoutes);

// SERVER START
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
