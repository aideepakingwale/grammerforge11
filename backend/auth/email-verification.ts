import crypto from "node:crypto";
import { promises as dns } from "node:dns";
import nodemailer from "nodemailer";

const blockedDomains = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "localhost"
]);

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function assertRealRegistrationEmail(email: string) {
  const normalised = normaliseEmail(email);
  const domain = normalised.split("@")[1];
  if (!domain || blockedDomains.has(domain) || domain.endsWith(".test") || domain.endsWith(".invalid")) {
    throw new Error("Please use a real email address. Temporary, example, or test domains are not accepted.");
  }

  try {
    const mx = await dns.resolveMx(domain);
    if (mx.length > 0) return normalised;
  } catch {
    // Fall through to A/AAAA lookup for smaller domains that receive mail through the root host.
  }

  try {
    const addresses = await dns.lookup(domain);
    if (addresses.address) return normalised;
  } catch {
    throw new Error("This email domain could not be verified. Please use a real reachable email address.");
  }

  return normalised;
}

export function createVerificationToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export function hashVerificationToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function sendVerificationEmail(input: { email: string; firstName: string; token: string }) {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM", "APP_URL"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Email verification is not configured. Missing: ${missing.join(", ")}.`);
  }

  const appUrl = process.env.APP_URL!.replace(/\/$/, "");
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(input.token)}`;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: input.email,
    subject: "Confirm your GrammarForge account",
    text: [
      `Hello ${input.firstName},`,
      "",
      "Please confirm your email address to activate your account:",
      verifyUrl,
      "",
      "This link expires in 24 hours. If you did not request this account, ignore this email."
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17211f">
        <h2>Confirm your GrammarForge account</h2>
        <p>Hello ${input.firstName},</p>
        <p>Please confirm your email address to activate your account.</p>
        <p><a href="${verifyUrl}" style="display:inline-block;background:#1e6f73;color:white;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:700">Confirm email</a></p>
        <p>This link expires in 24 hours. If you did not request this account, ignore this email.</p>
      </div>
    `
  });
}
