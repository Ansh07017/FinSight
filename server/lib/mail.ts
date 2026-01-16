// server/lib/mail.ts
import nodemailer from "nodemailer";

// Create the transporter using standard Gmail service
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: `"FinSight Security" <${process.env.EMAIL_USER}>`, // Custom sender name
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}. MessageID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}