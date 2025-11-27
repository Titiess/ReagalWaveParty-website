// Email service has been intentionally disabled — ticket delivery is handled
// directly via the success page and the `/tickets/:ticketId.pdf` endpoint.
// Keep a harmless no-op export to avoid runtime import errors in case any
// code still references it.
import type { Ticket } from "@shared/schema";

export async function sendTicketEmail(_ticket: Ticket, _pdfBuffer: Buffer): Promise<void> {
  // No-op: email service disabled. If this is called, log a notice.
  console.warn('sendTicketEmail called but email service is disabled.');
  return Promise.resolve();
}
