import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Email backend is running!");
});

// API → Email Send
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, text } = req.body;

    // Gmail SMTP (requires App Password)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER, // your Gmail
        pass: process.env.EMAIL_PASS, // your Gmail App Password
      },
    });

    // Verify SMTP connection (debug)
    await transporter.verify();
    console.log("SMTP Verified ✅");

    const info = await transporter.sendMail({
      from: `"Audit App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log("Email sent:", info.messageId);

    res.json({ success: true, message: "Email sent successfully!" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Render will use PORT from environment
const PORT = process.env.PORT || 10000;

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
