import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/send-email", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: req.body.to,
      subject: req.body.subject,
      text: req.body.text,
    });

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

export default router;
import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/send-email", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: req.body.to,
      subject: req.body.subject,
      text: req.body.text,
    });

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

export default router;
