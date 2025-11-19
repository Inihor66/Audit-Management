import nodemailer from "nodemailer";

export default async (req, res) => {
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

  res.json({ status: "sent" });
};
