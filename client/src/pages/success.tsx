import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Download, ArrowLeft, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { Ticket } from "@shared/schema";
import QRCode from "qrcode";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Success() {
  const [, setLocation] = useLocation();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txRef = params.get("tx_ref");
    const transactionId = params.get("transaction_id") || params.get("transactionId") || params.get("transaction_id") || params.get("transactionid");

    if (!txRef) {
      setLocation("/");
      return;
    }

    setTicketId(txRef);

    // If we have a transaction id from the redirect, ask the server to verify
    // immediately (faster than waiting for webhook). This will mark the
    // ticket successful and generate the PDF if verification passes.
    if (txRef && transactionId) {
      (async () => {
        try {
          const verified = await apiRequest("GET", `/api/tickets/${txRef}/verify?transaction_id=${encodeURIComponent(transactionId)}`);
          if (verified && verified.paymentStatus === "successful") {
            setTicket(verified);
            QRCode.toDataURL(txRef, { width: 240 }).then((d) => setQrDataUrl(d)).catch(() => {});
            setLoading(false);
            return;
          }
        } catch (e) {
          // ignore — we'll fall back to normal polling
          console.debug("Immediate verify failed, falling back to polling", e);
        }
      })();
    }
  }, [setLocation]);

  // load ticket helper
  async function loadTicket(txRef: string) {
    const t = await apiRequest("GET", `/api/tickets/${txRef}`);
    return t as Ticket;
  }

  // initial load + polling until paymentStatus === 'successful'
  useEffect(() => {
    if (!ticketId) return;
    let mounted = true;
    let attempts = 0;

    const check = async () => {
      setLoading(true);
      try {
        const t = await loadTicket(ticketId);
        if (!mounted) return;
        setTicket(t);
        // generate qr on load
        QRCode.toDataURL(ticketId, { width: 240 }).then((d) => { if (mounted) setQrDataUrl(d); }).catch(() => {});

        if (t.paymentStatus === "successful") {
          setLoading(false);
          return;
        }
      } catch (e) {
        // ignore and retry
      }

      attempts += 1;
      if (attempts < 20 && mounted) {
        setTimeout(check, 3000);
      } else {
        if (mounted) setLoading(false);
      }
    };

    check();
    return () => { mounted = false; };
  }, [ticketId]);

  if (!ticketId) return null;

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-8 text-center">
            <CheckCircle className="w-20 h-20 text-primary mx-auto mb-4" data-testid="icon-success" />
            <CardTitle className="text-3xl md:text-4xl font-bold mb-2">Payment Received</CardTitle>
            <p className="text-muted-foreground text-lg">Your ticket will be available below</p>
          </div>

          <CardContent className="p-8 space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Waiting for payment confirmation...</p>
              </div>
            ) : ticket ? (
              <div className="space-y-6">
                <div className="text-center p-6 bg-primary/10 rounded-lg border-2 border-primary/30">
                  <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Ticket ID</p>
                  <p className="text-2xl md:text-3xl font-bold text-primary font-mono" data-testid="text-ticket-id">{ticket.ticketId}</p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <a href={`/tickets/${ticket.ticketId}.pdf`} target="_blank" rel="noreferrer">
                    <Button variant="default"><Download className="w-4 h-4 mr-2" /> Download Ticket PDF</Button>
                  </a>

                  <Button variant="outline" onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(ticket.ticketId);
                      toast({ title: 'Copied', description: 'Ticket ID copied to clipboard' });
                    } catch (e) {
                      toast({ title: 'Error', description: 'Failed to copy ticket ID' });
                    }
                  }}><Copy className="w-4 h-4 mr-2" />Copy Ticket ID</Button>
                </div>

                <div className="flex items-center justify-center">
                  {qrDataUrl ? <img src={qrDataUrl} alt="Ticket QR" className="w-48 h-48" /> : <div className="w-48 h-48 flex items-center justify-center text-sm text-muted-foreground">QR unavailable</div>}
                </div>

                <div className="text-center">
                  <Button variant="ghost" onClick={() => setLocation('/')}>Return to Event Page</Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">Ticket not found. If you just paid, wait a moment and refresh this page.</p>
                <div className="mt-4">
                  <Button onClick={() => window.location.reload()}>Refresh</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
