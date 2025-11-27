import React from "react";
import { Button } from "@/components/ui/button";

type Sponsor = {
  id: string;
  name: string;
  description: string;
  phone: string;
  logo: string; // relative to / (served from public/)
  website?: string;
};

export function Sponsors({ sponsors }: { sponsors: Sponsor[] }) {
  return (
    <section className="max-w-6xl mx-auto py-12 px-6">
      <h3 className="text-2xl font-bold text-center mb-6">Our Sponsors</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {sponsors.map((s) => (
          <div key={s.id} className="p-4 bg-card/50 rounded-lg border border-border flex flex-col items-center text-center">
            <div className="w-28 h-28 mb-4 flex items-center justify-center">
              {/* Logo served from public folder */}
              <img src={s.logo} alt={`${s.name} logo`} className="max-w-full max-h-full object-contain" />
            </div>
            <h4 className="font-semibold">{s.name}</h4>
            <p className="text-sm text-muted-foreground mt-2">{s.description}</p>
            <a className="mt-3 text-primary font-medium" href={`tel:${s.phone.replace(/\s+/g, "")}`}>{s.phone}</a>
            {s.website && (
              <div className="mt-3">
                <Button asChild size="sm"><a href={s.website} target="_blank" rel="noreferrer">Visit</a></Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default Sponsors;
