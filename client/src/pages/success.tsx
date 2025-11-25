import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CheckCircle, Mail, Download, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ticket } from "@shared/schema";

export default function Success() {
  const [, setLocation] = useLocation();
  const [ticketId, setTicketId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txRef = params.get("tx_ref");
    const status = params.get("status");
    
    if (status !== "successful" || !txRef) {
      setLocation("/");
      return;
    }
    
    setTicketId(txRef);
  }, [setLocation]);

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ["/api/tickets", ticketId],
    enabled: !!ticketId,
  });

  if (isLoading || !ticketId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-8 text-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Confirming your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-8 text-center">
            <CheckCircle className="w-20 h-20 text-primary mx-auto mb-4 animate-in zoom-in duration-700" data-testid="icon-success" />
            <CardTitle className="text-3xl md:text-4xl font-bold mb-2">
              Payment Successful!
            </CardTitle>
            <p className="text-muted-foreground text-lg">
              Your ticket has been confirmed
            </p>
          </div>

          <CardContent className="p-8 space-y-8">
            {ticket && (
              <>
                <div className="space-y-4">
                  <div className="text-center p-6 bg-primary/10 rounded-lg border-2 border-primary/30">
                    <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Ticket ID</p>
                    <p className="text-2xl md:text-3xl font-bold text-primary font-mono" data-testid="text-ticket-id">
                      {ticket.ticketId}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-card/50 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Name</p>
                      <p className="font-semibold" data-testid="text-name">{ticket.name}</p>
                    </div>
                    <div className="p-4 bg-card/50 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Email</p>
                      <p className="font-semibold truncate" data-testid="text-email">{ticket.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-lg">
                    <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Check Your Email</h3>
                      <p className="text-sm text-muted-foreground">
                        Your ticket has been sent to <span className="font-medium text-foreground">{ticket.email}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Please check your inbox and spam folder
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-lg">
                    <Download className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">PDF Ticket</h3>
                      <p className="text-sm text-muted-foreground">
                        Your ticket includes a unique QR code for event check-in
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setLocation("/")}
                    className="w-full sm:w-auto"
                    data-testid="button-home"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Return to Event Page
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border space-y-2">
                  <p className="font-semibold">Event Details</p>
                  <p>Wave & Vibe Pool Party</p>
                  <p>Saturday, December 7, 2025 at 12:00 PM</p>
                  <p className="text-xs">Gladman Hotel, Uyo</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
