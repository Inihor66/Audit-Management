import express, { Request, Response } from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------------
// Root endpoint
// ----------------------------
app.get("/", (_req: Request, res: Response) => {
  res.send("Email backend is running!");
});

// ----------------------------
// POST → Send Email
// ----------------------------
app.post("/api/send-email", async (req: Request, res: Response) => {
  try {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
      return res.status(400).json({
        success: false,
        message: "Missing 'to', 'subject', or 'text' field.",
      });
    }

    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER, // Gmail
        pass: process.env.EMAIL_PASS, // App Password
      },
    });

    // Verify SMTP connection
    await transporter.verify();
    console.log("SMTP Verified ✅");

    // Sending email
    const info = await transporter.sendMail({
      from: `"Audit App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log("Email sent:", info.messageId);

    return res.json({
      success: true,
      message: "Email sent successfully!",
    });

  } catch (error: any) {
    console.error("Email Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send email.",
      error: error.message,
    });
  }
});

// ----------------------------
// Start Server
// ----------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
