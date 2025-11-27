import { useRef } from "react";
import { useLocation } from "wouter";
import { Calendar, Clock, MapPin, Users, Sparkles, Trophy, Music, Instagram, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoUrl from "@assets/ChatGPT Image Nov 20, 2025, 11_08_58 PM_1764070932389.png";
import Sponsors from "@/components/sponsors";
import { sponsors } from "@/data/sponsors";

export default function Home() {
  const [, setLocation] = useLocation();
  const ticketSectionRef = useRef<HTMLElement>(null);

  const scrollToTickets = () => {
    ticketSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50"></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 animate-in fade-in duration-1000">
          <img 
            src={logoUrl} 
            alt="Regal Star Gym" 
            className="w-48 md:w-64 lg:w-80 mx-auto animate-in zoom-in duration-700 drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]"
            data-testid="img-logo"
          />
          
          <div className="space-y-4">
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider uppercase"
              data-testid="text-event-title"
            >
              <span className="text-primary">Wave & Vibe</span>
              <br />
              <span className="text-foreground">Pool Party</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground font-medium" data-testid="text-event-subtitle">
              An Unforgettable Experience
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center text-lg font-medium">
            <div className="flex items-center gap-2" data-testid="text-event-date">
              <Calendar className="w-5 h-5 text-primary" />
              <span>Saturday, December 6, 2025</span>
            </div>
            <div className="hidden sm:block text-primary">•</div>
            <div className="flex items-center gap-2" data-testid="text-event-time">
              <Clock className="w-5 h-5 text-primary" />
              <span>12:00 PM</span>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-center text-base" data-testid="text-event-venue">
            <MapPin className="w-5 h-5 text-primary" />
            <span>Gladman Hotel, No 2b Udouweme Street, off Abak Road, Uyo</span>
          </div>

          <Button 
            size="lg" 
            className="text-lg px-12 py-6 h-auto font-bold tracking-wide shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            onClick={scrollToTickets}
            data-testid="button-purchase-ticket-hero"
          >
            Purchase Ticket
          </Button>
        </div>
      </section>

      {/* Event Details Section */}
      <section className="py-16 md:py-24 px-6" data-testid="section-event-details">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-wide uppercase" data-testid="text-details-heading">
            Event <span className="text-primary">Details</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="hover-elevate transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <Calendar className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Date & Time</h3>
                    <p className="text-muted-foreground">Saturday, December 6, 2025</p>
                    <p className="text-muted-foreground">12:00 PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <MapPin className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Venue</h3>
                    <p className="text-muted-foreground">Gladman Hotel</p>
                    <p className="text-muted-foreground text-sm">No 2b Udouweme Street, off Abak Road, Uyo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-12 hover-elevate transition-all duration-300">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-primary">•</span> Ticket Pricing
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-secondary/30 rounded-lg" data-testid="card-price-guys">
                  <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Early Bird - Guys</p>
                  <p className="text-4xl font-bold text-primary">₦5,000</p>
                </div>
                <div className="text-center p-6 bg-secondary/30 rounded-lg" data-testid="card-price-ladies">
                  <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Early Bird - Ladies</p>
                  <p className="text-4xl font-bold text-primary">₦3,000</p>
                </div>
                <div className="text-center p-6 bg-secondary/30 rounded-lg" data-testid="card-price-gate">
                  <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Gate @Venue</p>
                  <p className="text-4xl font-bold text-primary">₦8,000</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate transition-all duration-300">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-primary">•</span> What to Expect
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Trophy className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Fun Games</h4>
                    <p className="text-sm text-muted-foreground">Exciting pool games and competitions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Music className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Live Music</h4>
                    <p className="text-sm text-muted-foreground">DJ and live performances</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Community</h4>
                    <p className="text-sm text-muted-foreground">Network and connect with others</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Payment Section */}
      <section ref={ticketSectionRef} className="py-16 md:py-24 px-6 bg-card/30" data-testid="section-payment">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-wide uppercase">
              Get Your <span className="text-primary">Ticket</span>
            </h2>
            <p className="text-muted-foreground">Secure your spot at the most anticipated pool party of the year</p>
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              className="text-lg px-12 py-6 h-auto font-bold tracking-wide shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              onClick={() => setLocation("/purchase")}
              data-testid="button-buy-ticket"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Buy Ticket Now
            </Button>
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="py-16 md:py-24 px-6" data-testid="section-sponsors">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-wide uppercase">
            Our <span className="text-primary">Sponsors</span>
          </h2>
          
          {/* Sponsor cards component (data-driven). Place logos in client/public/sponsors/ */}
          {/* Example: client/public/sponsors/dneros-bistro.png for D'Nero's Bistro */}
          <Sponsors sponsors={sponsors} />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border" data-testid="footer">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-wide">REGAL STAR GYM</h3>
            <p className="text-muted-foreground">Your Premium Fitness Destination</p>
          </div>
          
          <div className="w-16 h-px bg-primary mx-auto"></div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">For Sponsorship Inquiries:</p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-foreground font-medium">
              <a href="tel:08145036786" className="hover:text-primary transition-colors" data-testid="link-contact-1">
                08145036786
              </a>
              <span className="text-primary">•</span>
              <a href="tel:09038114850" className="hover:text-primary transition-colors" data-testid="link-contact-2">
                09038114850
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Follow Us</p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="https://www.instagram.com/regalstargym/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Regal Star Gym on Instagram"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>

              <a
                href="https://www.facebook.com/profile.php?id=61583355857832"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Regal Star Gym on Facebook"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground pt-4">
            © 2025 Regal Star Gym. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
