import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { insertTicketSchema, type InsertTicket } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, ShieldCheck, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Purchase() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPrice, setSelectedPrice] = useState<number>(0);

  const form = useForm<InsertTicket>({
    resolver: zodResolver(insertTicketSchema),
    defaultValues: {
      name: "",
      email: "",
      gender: undefined,
      amount: 0,
      paymentStatus: "pending",
    },
  });

  const initializePaymentMutation = useMutation({
    mutationFn: async (data: InsertTicket) => {
      // apiRequest now returns parsed JSON (or text). Return it directly.
      const payload = await apiRequest("POST", "/api/tickets/initialize-payment", data);
      console.debug("InitializePayment response payload:", payload);
      return payload;
    },
    onSuccess: (response: any) => {
      // Backend returns { paymentLink, ticketId } on success. Treat any
      // 200 response with a paymentLink as success and redirect.
      const paymentLink = response?.paymentLink;
      if (!paymentLink) {
        console.error("InitializePayment unexpected payload:", response);
        toast({
          title: "Error",
          description: "Payment initialization failed. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Redirect the user to the payment checkout page
      console.info("Redirecting to payment link", paymentLink);
      window.location.href = paymentLink;
    },
    onError: (error: any) => {
      console.error("InitializePayment error:", error);
      // If the error is a Response with JSON, attempt to log backend message
      let message = error?.message || "Failed to initialize payment. Please try again.";
      try {
        // some thrown errors may be an Error wrapping a Response
        if (error?.json && typeof error.json === "function") {
          error.json()
            .then((payload: any) => {
              console.debug("InitializePayment error payload:", payload);
            })
            .catch(() => {
              /* ignore parse errors */
            });
        }
      } catch (e) {
        // ignore JSON parse errors
      }

      toast({
        title: "Payment Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTicket) => {
    if (selectedPrice === 0) {
      toast({
        title: "Error",
        description: "Please select a ticket type",
        variant: "destructive",
      });
      return;
    }
    
    const ticketData = {
      ...data,
      amount: selectedPrice, // Amount in NGN
    };
    
    initializePaymentMutation.mutate(ticketData);
  };

  const handleGenderChange = (value: "male" | "female") => {
    form.setValue("gender", value);
    if (value === "male") {
      setSelectedPrice(5000);
    } else {
      setSelectedPrice(3000);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-8"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Event Page
        </Button>

        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-2 pb-8">
            <CardTitle className="text-3xl md:text-4xl font-bold tracking-wide">
              <span className="text-primary">Purchase</span> Ticket
            </CardTitle>
            <CardDescription className="text-base">
              Wave & Vibe Pool Party - December 7, 2025
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          {...field}
                          className="h-12 text-base"
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          {...field}
                          className="h-12 text-base"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Ticket Type</FormLabel>
                      <Select
                        onValueChange={handleGenderChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 text-base" data-testid="select-gender">
                            <SelectValue placeholder="Select ticket type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male" data-testid="option-male">
                            Guys - Early Bird (₦5,000)
                          </SelectItem>
                          <SelectItem value="female" data-testid="option-female">
                            Ladies - Early Bird (₦3,000)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedPrice > 0 && (
                  <div className="p-6 bg-primary/10 rounded-lg border border-primary/30" data-testid="card-price-summary">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">Ticket Price:</span>
                      <span className="text-2xl font-bold text-primary">₦{selectedPrice.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Early Bird Special - Save ₦3,000 from gate price
                    </p>
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <span>Secure payment powered by Flutterwave</span>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full text-lg py-6 h-auto font-bold tracking-wide shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                    disabled={initializePaymentMutation.isPending || selectedPrice === 0}
                    data-testid="button-proceed-payment"
                  >
                    {initializePaymentMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
              <p>Your ticket will be emailed to you immediately after successful payment</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
