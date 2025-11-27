import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTicketSchema } from "@shared/schema";
import { z } from "zod";
import axios from "axios";
import { generateTicketPDF } from "./pdf-generator";
import fs from "fs/promises";
import path from "path";

function generateTicketId(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `RSG-PPOOL-${randomNum}`;
}

function maskKey(key?: string) {
  if (!key) return "(missing)";
  if (key.length <= 10) return `${key.slice(0, 4)}…`;
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const flutterwavePublicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
  const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;

  console.log("FLUTTERWAVE_WEBHOOK_SECRET:", maskKey(webhookSecret));
  console.log("FLUTTERWAVE_PUBLIC_KEY:", maskKey(flutterwavePublicKey));
  console.log("FLUTTERWAVE_SECRET_KEY:", maskKey(flutterwaveSecretKey));

  if (!webhookSecret) {
    console.error("❌ CRITICAL: FLUTTERWAVE_WEBHOOK_SECRET environment variable is not set");
    throw new Error("FLUTTERWAVE_WEBHOOK_SECRET is required for webhook verification");
  }
  if (!flutterwavePublicKey || !flutterwaveSecretKey) {
    console.error("❌ CRITICAL: FLUTTERWAVE_PUBLIC_KEY or FLUTTERWAVE_SECRET_KEY missing");
    throw new Error("FLUTTERWAVE keys are required");
  }

  // Initialize payment endpoint
  app.post("/api/tickets/initialize-payment", async (req, res) => {
    try {
      const validatedData = insertTicketSchema.parse(req.body);
      const ticketId = generateTicketId();

      const ticket = await storage.createTicket({
        ...validatedData,
        ticketId,
      });

      const paymentData = {
        tx_ref: ticketId,
        amount: validatedData.amount,
        currency: "NGN",
        redirect_url: `${req.protocol}://${req.get("host")}/success`,
        customer: {
          email: validatedData.email,
          name: validatedData.name,
        },
        customizations: {
          title: "Regal Star Gym - Wave & Vibe Pool Party",
          description: `Ticket for ${validatedData.name}`,
          logo: `${req.protocol}://${req.get("host")}/logo.png`,
        },
        meta: {
          ticket_id: ticketId,
          gender: validatedData.gender,
        },
      };

      const response = await axios.post(
        "https://api.flutterwave.com/v3/payments",
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${flutterwaveSecretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.status === "success" && response.data?.data?.link) {
        return res.json({ paymentLink: response.data.data.link, ticketId });
      }

      console.error("Flutterwave init failed:", response.data);
      return res.status(500).json({ message: "Failed to initialize payment" });
    } catch (error: any) {
      console.error("Payment initialization error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      return res.status(500).json({ message: error.message || "Failed to initialize payment" });
    }
  });

  // Webhook endpoint for Flutterwave payment confirmation
  app.post("/api/webhooks/flutterwave", async (req, res) => {
    try {
      const webhookSecretLocal = process.env.FLUTTERWAVE_WEBHOOK_SECRET!;
      const verifHash = req.headers["verif-hash"];
      const flwSignature = req.headers["flutterwave-signature"];

      // Verify signature
      if (flwSignature && webhookSecretLocal) {
        const crypto = await import("crypto");
        const rawBody = req.rawBody as Buffer;
        if (!rawBody) {
          console.error("Raw body not available for HMAC verification");
          return res.status(401).json({ message: "Unauthorized - raw body missing" });
        }
        const hash = crypto.createHmac("sha256", webhookSecretLocal).update(rawBody).digest("base64");
        if (hash !== flwSignature) {
          console.log("Webhook HMAC verification failed. Expected:", hash, "Received:", flwSignature);
          return res.status(401).json({ message: "Unauthorized - invalid signature" });
        }
        console.log("✓ Webhook verified using HMAC-SHA256");
      } else if (verifHash && webhookSecretLocal) {
        if (verifHash !== webhookSecretLocal) {
          console.log("Webhook verif-hash verification failed");
          return res.status(401).json({ message: "Unauthorized - invalid hash" });
        }
        console.log("✓ Webhook verified using verif-hash (legacy)");
      } else {
        console.error("No webhook signature provided");
        return res.status(401).json({ message: "Unauthorized - no signature" });
      }

      const payload = req.body;
      console.log("Webhook received:", JSON.stringify({
        event: payload.event,
        status: payload.data?.status,
        tx_ref: payload.data?.tx_ref,
        amount: payload.data?.amount,
        currency: payload.data?.currency
      }, null, 2));

      if (!payload.event || !payload.data) {
        console.error("Invalid webhook payload: missing event or data");
        return res.status(400).json({ message: "Invalid payload structure" });
      }

      if (payload.event === "charge.completed") {
        const { status, tx_ref, amount, currency, flw_ref, customer } = payload.data;
        if (!tx_ref) {
          console.error("Missing tx_ref in payload");
          return res.status(400).json({ message: "Missing transaction reference" });
        }

        const ticket = await storage.getTicketByTicketId(tx_ref);
        if (!ticket) {
          console.error(`Ticket not found for tx_ref: ${tx_ref}`);
          return res.status(404).json({ message: "Ticket not found" });
        }

        // Debug logs
        console.log("Webhook customer.email:", customer?.email);
        console.log("Stored ticket.email:", ticket.email);
        if (customer?.email !== ticket.email) {
          console.warn(`Email mismatch: received ${customer?.email}, expected ${ticket.email} — using stored ticket.email for receipt`);
        }

        if (currency !== "NGN") {
          console.error(`Invalid currency: ${currency}, expected NGN`);
          return res.status(400).json({ message: "Invalid currency" });
        }

        if (amount !== ticket.amount) {
          console.error(`Amount mismatch: received ${amount}, expected ${ticket.amount}`);
          return res.status(400).json({ message: "Amount mismatch" });
        }

        if (status === "successful") {
          // Mark processing atomically. If this returns false, another process already handled it.
          const marked = await storage.markTicketProcessing(ticket.id, flw_ref);
          if (!marked) {
            console.log(`Ticket ${tx_ref} already being processed or completed. Skipping duplicate webhook.`);
            return res.status(200).json({ status: "received", message: "Already processed or processing" });
          }

          console.log(`Processing successful payment for ticket ${tx_ref}`);

          try {
            console.log(`Generating PDF for ticket ${tx_ref}`);
            const pdfBuffer = await generateTicketPDF(ticket);

            // Save copy of PDF to tickets folder (best-effort)
            try {
              const ticketsDir = path.resolve(process.cwd(), "tickets");
              await fs.mkdir(ticketsDir, { recursive: true });
              const pdfPath = path.resolve(ticketsDir, `${ticket.ticketId}.pdf`);
              await fs.writeFile(pdfPath, pdfBuffer);
              console.log(`Saved ticket PDF to ${pdfPath}`);
            } catch (saveErr) {
              console.warn("Could not save ticket PDF to disk:", saveErr);
            }

            // Since email delivery is not required, mark successful and return.
            await storage.updateTicketPaymentStatus(ticket.id, "successful", flw_ref);
            console.log(`Ticket ${tx_ref} marked successful. PDF available at /tickets/${ticket.ticketId}.pdf`);

            return res.status(200).json({ status: "success", message: "Payment processed and ticket generated" });
          } catch (err) {
            console.error("Error generating ticket PDF:", err);
            // Mark as failed so you can later investigate or retry manually
            await storage.updateTicketPaymentStatus(ticket.id, "failed", flw_ref);
            return res.status(200).json({ status: "success", message: "Payment processed but ticket generation failed" });
          }
        } else if (status === "failed") {
          console.log(`Payment failed for ticket ${tx_ref}`);
          await storage.updateTicketPaymentStatus(ticket.id, "failed", flw_ref);
          return res.status(200).json({ status: "received", message: "Payment failed" });
        } else {
          console.log(`Payment status ${status} for ticket ${tx_ref} - no action taken`);
          return res.status(200).json({ status: "received", message: `Status ${status} noted` });
        }
      }

      console.log(`Unhandled webhook event: ${payload.event}`);
      return res.status(200).json({ status: "received", message: "Event not handled" });
    } catch (error) {
      console.error("Webhook error:", error);
      return res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // ticket retrieval endpoints (unchanged)
  // Verify a ticket/payment immediately by calling Flutterwave (used by success page)
  app.get("/api/tickets/:ticketId/verify", async (req, res) => {
    try {
      const { ticketId } = req.params;
      const transactionId = (req.query.transaction_id as string) || (req.query.transactionId as string);

      const ticket = await storage.getTicketByTicketId(ticketId);
      if (!ticket) return res.status(404).json({ message: "Ticket not found" });

      // If already successful, return immediately
      if (ticket.paymentStatus === "successful") return res.json(ticket);

      // Require a transaction id to verify immediately
      if (!transactionId) {
        return res.status(400).json({ message: "transaction_id query parameter required" });
      }

      // Call Flutterwave verify endpoint
      try {
        const resp = await axios.get(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, {
          headers: { Authorization: `Bearer ${flutterwaveSecretKey}` },
        });

        const data = resp.data;
        if (data?.status === "success" && data?.data) {
          const fld = data.data;
          // Validate amount and currency
          const amount = fld.amount;
          const currency = fld.currency;
          const txRef = fld.tx_ref;

          if (currency !== "NGN" || amount !== ticket.amount) {
            console.warn(`Verification mismatch for ${ticketId}: amount/currency`, { amount, currency, expected: ticket.amount });
            // Don't mark successful if mismatch; return current ticket state
            return res.status(400).json({ message: "Verification mismatch", ticket });
          }

          // Generate PDF and save (best-effort)
          try {
            const pdfBuffer = await generateTicketPDF(ticket);
            const ticketsDir = path.resolve(process.cwd(), "tickets");
            await fs.mkdir(ticketsDir, { recursive: true });
            const pdfPath = path.resolve(ticketsDir, `${ticket.ticketId}.pdf`);
            await fs.writeFile(pdfPath, pdfBuffer);
          } catch (e) {
            console.warn("Failed to generate/save PDF during verify:", e);
          }

          await storage.updateTicketPaymentStatus(ticket.id, "successful", transactionId);
          const updated = await storage.getTicketByTicketId(ticketId);
          return res.json(updated);
        }

        return res.status(400).json({ message: "Transaction not successful", detail: data });
      } catch (err: any) {
        console.error("Error verifying transaction with Flutterwave:", err?.response?.data || err.message || err);
        return res.status(500).json({ message: "Failed to verify transaction" });
      }
    } catch (error) {
      console.error("Verify endpoint error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/tickets/:ticketId", async (req, res) => {
    try {
      const { ticketId } = req.params;
      const ticket = await storage.getTicketByTicketId(ticketId);
      if (!ticket) return res.status(404).json({ message: "Ticket not found" });
      res.json(ticket);
    } catch (error) {
      console.error("Get ticket error:", error);
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  app.get("/api/tickets", async (req, res) => {
    try {
      const tickets = await storage.getAllTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Get tickets error:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Serve ticket PDF (stream). If missing, regenerate using generateTicketPDF.
  app.get("/tickets/:ticketId.pdf", async (req, res) => {
    try {
      const { ticketId } = req.params;
      const ticket = await storage.getTicketByTicketId(ticketId);
      if (!ticket) return res.status(404).send("Ticket not found");

      const ticketsDir = path.resolve(process.cwd(), "tickets");
      await fs.mkdir(ticketsDir, { recursive: true });
      const pdfPath = path.resolve(ticketsDir, `${ticket.ticketId}.pdf`);

      const fsSync = await import('fs');
      if (fsSync.existsSync(pdfPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${ticket.ticketId}.pdf"`);
        const stream = fsSync.createReadStream(pdfPath);
        return stream.pipe(res);
      }

      try {
        const buffer = await generateTicketPDF(ticket);
        try { await fs.writeFile(pdfPath, buffer); } catch (e) { console.warn('Failed to save regenerated PDF:', e); }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${ticket.ticketId}.pdf"`);
        return res.send(buffer);
      } catch (genErr) {
        console.error('Failed to generate PDF for streaming:', genErr);
        return res.status(500).send('Failed to generate ticket PDF');
      }
    } catch (err) {
      console.error('Ticket PDF endpoint error:', err);
      return res.status(500).send('Server error');
    }
  });

  // Resend ticket email (regenerates PDF and sends email again)
  app.post("/api/tickets/:ticketId/resend-email", async (req, res) => {
    try {
      const { ticketId } = req.params;
      const ticket = await storage.getTicketByTicketId(ticketId);
      if (!ticket) return res.status(404).json({ message: "Ticket not found" });

      // Only resend for successful payments (or allow resend for processing too)
      if (ticket.paymentStatus !== "successful") {
        console.log(`Refusing to resend email for ticket ${ticketId} with status ${ticket.paymentStatus}`);
        return res.status(400).json({ message: "Cannot resend email for unpaid ticket" });
      }

      try {
        console.log(`Regenerating PDF for ticket ${ticketId} for resend`);
        const pdfBuffer = await generateTicketPDF(ticket);

        // Save regenerated PDF (best-effort) and return download URL
        try {
          const ticketsDir = path.resolve(process.cwd(), "tickets");
          await fs.mkdir(ticketsDir, { recursive: true });
          const pdfPath = path.resolve(ticketsDir, `${ticket.ticketId}.pdf`);
          await fs.writeFile(pdfPath, pdfBuffer);
          console.log(`Saved regenerated ticket PDF to ${pdfPath}`);
        } catch (saveErr) {
          console.warn("Could not save regenerated ticket PDF:", saveErr);
        }

        return res.json({ status: "ok", message: "PDF regenerated", downloadUrl: `/tickets/${ticket.ticketId}.pdf` });
      } catch (err) {
        console.error(`Failed to regenerate PDF for ticket ${ticketId}:`, err);
        return res.status(500).json({ message: "Failed to regenerate PDF" });
      }
    } catch (error) {
      console.error("Resend endpoint error:", error);
      res.status(500).json({ message: "Failed to resend email" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
