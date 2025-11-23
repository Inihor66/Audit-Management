// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import emailRoutes from "./routes/emailRoutes.js";

dotenv.config();

const app = express();

// MIDDLEWARES
app.use(cors());
app.use(express.json());

// TEST ROOT ROUTE
app.get("/", (req, res) => {
  res.send("Audit App Backend Running Successfully ✔️");
});

// MAIN API ROUTES
app.use("/api", emailRoutes);   // <-- IMPORTANT (DON’T CHANGE)

// START SERVER
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
