import express from "express";
import emailRoute from "./server/sendEmail.js";

const app = express();
app.use(express.json());

// API route
app.use("/api", emailRoute);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log("Server running on port " + port));
