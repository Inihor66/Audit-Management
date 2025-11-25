// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import emailRoutes from "./routes/emailRoutes.js";

dotenv.config();

const app = express();

// ------------------ FIXED CORS ------------------
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://audit-management-gray.vercel.app",
      "https://audit-management-2.onrender.com"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
// -------------------------------------------------

app.use(express.json());

// TEST ROOT ROUTE
app.get("/", (req, res) => {
  res.send("Audit App Backend Running Successfully ✔️");
});

// MAIN API ROUTES
app.use("/api", emailRoutes);

// START SERVER
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
