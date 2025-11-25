import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTicketSchema } from "@shared/schema";
import { z } from "zod";
import axios from "axios";
import { generateTicketPDF } from "./pdf-generator";
import { sendTicketEmail } from "./email-service2";

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
  // Validate required environment variables at startup
  const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const flutterwavePublicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
  const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;

  console.log("FLUTTERWAVE_WEBHOOK_SECRET:", maskKey(webhookSecret));
  console.log("FLUTTERWAVE_PUBLIC_KEY:", maskKey(flutterwavePublicKey));
  console.log("FLUTTERWAVE_SECRET_KEY:", maskKey(flutterwaveSecretKey));

  if (!webhookSecret) {
    console.error("❌ CRITICAL: FLUTTERWAVE_WEBHOOK_SECRET environment variable is not set");
    console.error("❌ Webhook verification will not work. Please set this variable before deploying.");
    throw new Error("FLUTTERWAVE_WEBHOOK_SECRET is required for webhook verification");
  }
  if (!flutterwavePublicKey || !flutterwaveSecretKey) {
    console.error("❌ CRITICAL: FLUTTERWAVE_PUBLIC_KEY or FLUTTERWAVE_SECRET_KEY missing");
    console.error("❌ The initialize-payment route will return 500 until these are set");
    throw new Error("FLUTTERWAVE_PUBLIC_KEY and FLUTTERWAVE_SECRET_KEY are required");
  }
  console.log("✓ FLUTTERWAVE_WEBHOOK_SECRET is configured");
  console.log("✓ FLUTTERWAVE keys present");

  // Initialize payment endpoint
  app.post("/api/tickets/initialize-payment", async (req, res) => {
    try {
      const validatedData = insertTicketSchema.parse(req.body);

      const ticketId = generateTicketId();

      // Create ticket in storage with pending status
      const ticket = await storage.createTicket({
        ...validatedData,
        ticketId,
      });

      // Build payment payload
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
          // Use the site's public logo if available; fall back to an external hosted logo
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
        return res.json({
          paymentLink: response.data.data.link,
          ticketId,
        });
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

      let isValid = false;

      if (flwSignature && webhookSecretLocal) {
        const crypto = await import("crypto");
        const rawBody = req.rawBody as Buffer;

        if (!rawBody) {
          console.error("Raw body not available for HMAC verification");
          return res.status(401).json({ message: "Unauthorized - raw body missing" });
        }

        const hash = crypto.createHmac("sha256", webhookSecretLocal)
          .update(rawBody)
          .digest("base64");

        isValid = hash === flwSignature;
        if (!isValid) {
          console.log("✗ Webhook HMAC-SHA256 verification failed");
          console.log("Expected:", hash);
          console.log("Received:", flwSignature);
          return res.status(401).json({ message: "Unauthorized - invalid signature" });
        }
        console.log("✓ Webhook verified using HMAC-SHA256");
      } else if (verifHash && webhookSecretLocal) {
        isValid = verifHash === webhookSecretLocal;
        if (!isValid) {
          console.log("✗ Webhook verif-hash verification failed");
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

        if (currency !== "NGN") {
          console.error(`Invalid currency: ${currency}, expected NGN`);
          return res.status(400).json({ message: "Invalid currency" });
        }

        if (amount !== ticket.amount) {
          console.error(`Amount mismatch: received ${amount}, expected ${ticket.amount}`);
          return res.status(400).json({ message: "Amount mismatch" });
        }

        if (customer?.email !== ticket.email) {
          console.error(`Email mismatch: received ${customer?.email}, expected ${ticket.email}`);
          return res.status(400).json({ message: "Email mismatch" });
        }

        if (status === "successful") {
          if (ticket.paymentStatus === "pending") {
            console.log(`Processing successful payment for ticket ${tx_ref}`);
            const updatedTicket = await storage.updateTicketPaymentStatus(
              ticket.id,
              "successful",
              flw_ref
            );

            if (!updatedTicket) {
              console.error("Failed to update ticket payment status");
              return res.status(500).json({ message: "Failed to update ticket" });
            }

            try {
              console.log(`Generating PDF for ticket ${tx_ref}`);
              const pdfBuffer = await generateTicketPDF(updatedTicket);

              // Save PDF to tickets directory for record-keeping
              try {
                const fs = await import("fs/promises");
                const path = await import("path");
                const ticketsDir = path.resolve(process.cwd(), "tickets");
                await fs.mkdir(ticketsDir, { recursive: true });
                const pdfPath = path.resolve(ticketsDir, `${updatedTicket.ticketId}.pdf`);
                await fs.writeFile(pdfPath, pdfBuffer);
                console.log(`Saved ticket PDF to ${pdfPath}`);
              } catch (saveErr) {
                console.warn("Could not save ticket PDF to disk:", saveErr);
              }

              console.log(`Sending email to ${updatedTicket.email}`);
              await sendTicketEmail(updatedTicket, pdfBuffer);
              console.log(`Ticket email sent successfully for ${tx_ref}`);

              return res.status(200).json({ status: "success", message: "Payment processed and ticket sent" });
            } catch (emailError) {
              console.error("Error generating/sending ticket:", emailError);
              return res.status(200).json({ status: "success", message: "Payment processed but email failed" });
            }
          } else {
            console.log(`Ticket ${tx_ref} already processed (status: ${ticket.paymentStatus})`);
            return res.status(200).json({ status: "success", message: "Already processed" });
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

  // Get ticket by ticket ID (for success page)
  app.get("/api/tickets/:ticketId", async (req, res) => {
    try {
      const { ticketId } = req.params;
      const ticket = await storage.getTicketByTicketId(ticketId);

      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      res.json(ticket);
    } catch (error) {
      console.error("Get ticket error:", error);
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  // Get all tickets (for future admin dashboard)
  app.get("/api/tickets", async (req, res) => {
    try {
      const tickets = await storage.getAllTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Get tickets error:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
