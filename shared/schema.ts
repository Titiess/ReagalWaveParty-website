import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: text("ticket_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  gender: text("gender").notNull(), // "male" or "female"
  amount: integer("amount").notNull(), // amount in NGN (Naira)
  paymentStatus: text("payment_status").notNull().default("pending"), // "pending", "successful", "failed"
  flutterwaveRef: text("flutterwave_ref"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  ticketId: true,
  createdAt: true,
}).extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  gender: z.enum(["male", "female"], { required_error: "Please select a gender" }),
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;
