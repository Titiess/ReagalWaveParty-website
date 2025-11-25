import nodemailer from "nodemailer";
import type { Ticket } from "@shared/schema";

let transporter: nodemailer.Transporter | null = null;

function createTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

  if (smtpUser && smtpPass) {
    if (smtpHost && smtpPort) {
      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
        },
      });
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  console.warn('No SMTP credentials provided - using jsonTransport (emails will not be sent)');
  return nodemailer.createTransport({ jsonTransport: true });
}

// Initialize transporter
transporter = createTransporter();

transporter.verify((err) => {
  if (err) {
    console.warn('Mail transporter verification failed:', err && (err.message || err));
  } else {
    console.log('Mail transporter verified and ready');
  }
});

export async function sendTicketEmail(ticket: Ticket, pdfBuffer: Buffer): Promise<void> {
  try {
    if (!transporter) transporter = createTransporter();

    const fromAddress = (process.env.SMTP_USER || process.env.EMAIL_USER) || 'no-reply@regalstargym.example';

    const mailOptions = {
      from: {
        name: 'Regal Star Gym',
        address: fromAddress,
      },
      to: ticket.email,
      subject: `Your Ticket for Wave & Vibe Pool Party - ${ticket.ticketId}`,
      html: `
        } catch (error) {
          console.error('Unexpected error in sendTicketEmail:', error);
        }
      }
          } else {
            console.log(`Ticket email sent to ${ticket.email}:`, info && (info.response || info.messageId));
          }
        });
      } catch (error) {
        console.error('Unexpected error in sendTicketEmail:', error);
      }
    }
                }
              });
            } catch (error) {
              console.error('Unexpected error in sendTicketEmail:', error);
            }
          }
                color: #D4AF37;
