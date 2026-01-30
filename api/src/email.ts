type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM = process.env.RESEND_FROM ?? "";

export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  if (!RESEND_API_KEY || !RESEND_FROM) {
    throw new Error("RESEND_API_KEY or RESEND_FROM is missing.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [to],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Resend failed: ${response.status} ${errorText}`);
  }
}
