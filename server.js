import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import emailRoutes from "./routes/emailRoutes.js";

dotenv.config();

const app = express();

// ✅ FIX: ALLOW BOTH LOCAL & VERCEL FRONTEND
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://audit-management-gray.vercel.app",   // <-- your Vercel frontend
    "https://audit-management.vercel.app"         // <-- optional future domain
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// TEST ROOT
app.get("/", (req, res) => {
  res.send("Audit App Backend Running Successfully ✔️");
});

// MAIN ROUTES
app.use("/api", emailRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
