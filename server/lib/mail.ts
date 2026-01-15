// server/lib/mail.ts
import Mailjet from 'node-mailjet';

// Initialize with keys from your .env
const mailjet = new Mailjet({
  apiKey: process.env.MJ_APIKEY_PUBLIC,
  apiSecret: process.env.MJ_APIKEY_PRIVATE
});

export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  try {
    const result = await mailjet
      .post("send", { version: 'v3.1' })
      .request({
        "Messages": [
          {
            "From": {
              "Email": "pratapsingh07017@gmail.com", // Your verified sender address
              "Name": "FinSight"
            },
            "To": [
              {
                "Email": to,
                "Name": "User"
              }
            ],
            "Subject": subject,
            "HTMLPart": htmlContent // Mailjet uses HTMLPart instead of html
          }
        ]
      });

    console.log(`Mailjet Success: Email sent to ${to}`);
    return result.body;
  } catch (error: any) {
    console.error("Mailjet Error:", error.statusCode, error.message);
    throw new Error('Failed to send email via Mailjet');
  }
};