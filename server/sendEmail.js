import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/send-email", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Audit App" <${process.env.EMAIL}>`,
      to: req.body.to,
      subject: req.body.subject,
      text: req.body.text,
    });

    console.log("Email sent:", info.messageId);

    res.json({ success: true });
  } catch (err) {
    console.error("Send email error:", err);
    res.json({ success: false, error: err.message });
  }
});

export default router;
