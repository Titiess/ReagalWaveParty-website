import { type Ticket, type InsertTicket } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export interface IStorage {
  createTicket(ticket: InsertTicket & { ticketId: string }): Promise<Ticket>;
  getTicket(id: string): Promise<Ticket | undefined>;
  getTicketByTicketId(ticketId: string): Promise<Ticket | undefined>;
  getTicketByFlutterwaveRef(ref: string): Promise<Ticket | undefined>;
  markTicketProcessing(id: string, flutterwaveRef?: string): Promise<boolean>;
  updateTicketPaymentStatus(id: string, status: string, flutterwaveRef?: string): Promise<Ticket | undefined>;
  getAllTickets(): Promise<Ticket[]>;
}

const TICKETS_FILE = path.resolve(process.cwd(), "tickets.json");
const TICKETS_DIR = path.resolve(process.cwd(), "tickets");

function ensureTicketsDir() {
  if (!fs.existsSync(TICKETS_DIR)) fs.mkdirSync(TICKETS_DIR, { recursive: true });
}

function readTicketsFile(): Ticket[] {
  try {
    if (!fs.existsSync(TICKETS_FILE)) return [];
    const raw = fs.readFileSync(TICKETS_FILE, "utf8");
    return JSON.parse(raw || "[]") as Ticket[];
  } catch (e) {
    console.error("Failed to read tickets.json", e);
    return [];
  }
}

function writeTicketsFile(tickets: Ticket[]) {
  try {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to write tickets.json", e);
    throw e;
  }
}

export class FileStorage implements IStorage {
  constructor() {
    ensureTicketsDir();
    if (!fs.existsSync(TICKETS_FILE)) writeTicketsFile([]);
  }

  async createTicket(insertTicket: InsertTicket & { ticketId: string }): Promise<Ticket> {
    const id = randomUUID();
    const ticket: Ticket = {
      ...insertTicket,
      id,
      paymentStatus: insertTicket.paymentStatus || "pending",
      createdAt: new Date(),
      flutterwaveRef: null,
    } as Ticket;

    const tickets = readTicketsFile();
    tickets.push(ticket);
    writeTicketsFile(tickets);
    return ticket;
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const tickets = readTicketsFile();
    return tickets.find(t => t.id === id);
  }

  async getTicketByTicketId(ticketId: string): Promise<Ticket | undefined> {
    const tickets = readTicketsFile();
    return tickets.find(t => t.ticketId === ticketId);
  }

  async getTicketByFlutterwaveRef(ref: string): Promise<Ticket | undefined> {
    const tickets = readTicketsFile();
    return tickets.find(t => t.flutterwaveRef === ref);
  }

  /**
   * Atomically mark a ticket as "processing" only if current status === "pending".
   * Returns true if mark succeeded, false if ticket not found or not pending.
   */
  async markTicketProcessing(id: string, flutterwaveRef?: string): Promise<boolean> {
    const tickets = readTicketsFile();
    const idx = tickets.findIndex(t => t.id === id);
    if (idx === -1) return false;
    const ticket = tickets[idx];
    if (ticket.paymentStatus !== "pending") {
      return false;
    }

    const updated: Ticket = {
      ...ticket,
      paymentStatus: "processing",
      flutterwaveRef: flutterwaveRef ?? ticket.flutterwaveRef,
    } as Ticket;

    tickets[idx] = updated;
    writeTicketsFile(tickets);
    return true;
  }

  async updateTicketPaymentStatus(id: string, status: string, flutterwaveRef?: string): Promise<Ticket | undefined> {
    const tickets = readTicketsFile();
    const idx = tickets.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    const ticket = tickets[idx];
    const updated: Ticket = {
      ...ticket,
      paymentStatus: status,
      flutterwaveRef: flutterwaveRef || ticket.flutterwaveRef,
    } as Ticket;
    tickets[idx] = updated;
    writeTicketsFile(tickets);
    return updated;
  }

  async getAllTickets(): Promise<Ticket[]> {
    return readTicketsFile();
  }
}

export const storage = new FileStorage();
