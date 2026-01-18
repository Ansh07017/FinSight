// server/lib/mail.ts
import nodemailer from "nodemailer";

// 👇 NEW: Configure OAuth2 Transporter (Bypasses Render Block)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,          // Your Gmail address
    clientId: process.env.GOOGLE_CLIENT_ID, // From Google Cloud
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // From Google Cloud
    refreshToken: process.env.GMAIL_REFRESH_TOKEN, // From OAuth Playground
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    // 🛡️ GUARD: Don't attempt to send if credentials are missing
    if (!process.env.GMAIL_REFRESH_TOKEN || !process.env.EMAIL_USER) {
      console.warn("⚠️ [Email] Skipped: Missing OAuth credentials in env.");
      return false; // Fail silently so the app keeps running
    }

    console.log(`📨 [Email] Attempting to send to ${to}...`);

    const info = await transporter.sendMail({
      from: `"FinSight Security" <${process.env.EMAIL_USER}>`, // Custom Sender Name
      to,
      subject,
      html,
    });

    console.log(`✅ [Email] Sent successfully. MessageID: ${info.messageId}`);
    return true;

  } catch (error: any) {
    // 🛡️ SAFETY NET: Catch errors so the app doesn't crash
    console.error("❌ [Email] Failed to send:", error.message);

    // Specific logging for Google limits
    if (error.response?.includes("quota") || error.response?.includes("limit")) {
      console.error("⚠️ [Email] Critical: Gmail Daily Limit Reached.");
    }
    
    // Return false so the calling function knows it failed
    return false;
  }
}