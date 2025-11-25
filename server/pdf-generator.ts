import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import type { Ticket } from "@shared/schema";

export async function generateTicketPDF(ticket: Ticket): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Generate QR code for ticket ID
      const qrCodeDataUrl = await QRCode.toDataURL(ticket.ticketId, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

         // Header with gold background
         doc.rect(0, 0, doc.page.width, 120).fill('#D4AF37');

         // Try to draw logo from public folder if available
         try {
            const fs = await import('fs');
            const path = await import('path');
            const candidatePaths = [
               path.resolve(process.cwd(), 'public', 'logo.png'),
               path.resolve(process.cwd(), 'client', 'public', 'logo.png'),
            ];
            for (const p of candidatePaths) {
               if (fs.existsSync(p)) {
                  // draw logo on the left
                  doc.image(p, 50, 20, { width: 100, height: 80 });
                  break;
               }
            }
         } catch (imgErr) {
            // ignore if logo can't be loaded
         }

         // Event Title
         doc.fillColor('#000000')
             .fontSize(32)
             .font('Helvetica-Bold')
             .text('REGAL STAR GYM', 160, 30, { align: 'left' });

         doc.fontSize(24)
             .text('Wave & Vibe Pool Party', 160, 70, { align: 'left' });

      // Ticket ID Section
      doc.fillColor('#000000')
         .fontSize(14)
         .font('Helvetica')
         .text('TICKET ID', 50, 150);

      doc.fontSize(20)
         .font('Courier-Bold')
         .fillColor('#D4AF37')
         .text(ticket.ticketId, 50, 175);

      // Attendee Information
      doc.fillColor('#000000')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('ATTENDEE INFORMATION', 50, 220);

      doc.fontSize(12)
         .font('Helvetica')
         .text(`Name: ${ticket.name}`, 50, 245)
         .text(`Email: ${ticket.email}`, 50, 265)
         .text(`Ticket Type: ${ticket.gender === 'male' ? 'Guys - Early Bird' : 'Ladies - Early Bird'}`, 50, 285)
         .text(`Amount Paid: ₦${ticket.amount.toLocaleString()}`, 50, 305);

      // Event Details
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('EVENT DETAILS', 50, 350);

      doc.fontSize(12)
         .font('Helvetica')
         .text('Date: Saturday, December 7, 2025', 50, 375)
         .text('Time: 12:00 PM', 50, 395)
         .text('Venue: Gladman Hotel', 50, 415)
         .text('Address: No 2b Udouweme Street, off Abak Road, Uyo', 50, 435);

      // QR Code
      const qrImage = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      doc.image(qrImage, doc.page.width - 230, 150, { width: 180, height: 180 });

      doc.fontSize(10)
         .fillColor('#666666')
         .text('Scan QR code at venue', doc.page.width - 230, 340, { 
           width: 180, 
           align: 'center' 
         });

      // Important Information
      doc.fontSize(14)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('IMPORTANT INFORMATION', 50, 490);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#333333')
         .text('• Please arrive at least 30 minutes before the event starts', 50, 515)
         .text('• Bring a valid ID for verification', 50, 535)
         .text('• This ticket is non-transferable and non-refundable', 50, 555)
         .text('• Keep this ticket safe and present it at the entrance', 50, 575);

      // Footer with gold line
      doc.moveTo(50, doc.page.height - 100)
         .lineTo(doc.page.width - 50, doc.page.height - 100)
         .strokeColor('#D4AF37')
         .lineWidth(2)
         .stroke();

      doc.fontSize(10)
         .fillColor('#666666')
         .font('Helvetica')
         .text('For inquiries, contact: 08145036786 | 09038114850', 50, doc.page.height - 75, {
           align: 'center',
           width: doc.page.width - 100
         });

      doc.fontSize(8)
         .text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric',
           hour: '2-digit',
           minute: '2-digit'
         })}`, 50, doc.page.height - 50, {
           align: 'center',
           width: doc.page.width - 100
         });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
