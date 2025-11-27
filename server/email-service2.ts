import nodemailer from "nodemailer";
import type { Ticket } from "@shared/schema";

// This file is intentionally left as a noop placeholder.
// The canonical implementation is `server/email-service.ts`.
// Keeping this file empty prevents accidental imports of duplicate logic.
export const __EMAIL_SERVICE2_NOOP = true;
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
