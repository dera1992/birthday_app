import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const tiers = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for a single birthday page and invite-led planning.",
    features: ["Birthday page", "Wishlist reservations", "Message moderation", "Basic event hosting"],
  },
  {
    name: "Host Pro",
    price: "5%",
    description: "Premium event monetization with protected platform escrow.",
    features: ["Paid event checkout", "Connect onboarding", "Refund guarantee flow", "Venue recommendations"],
    featured: true,
  },
  {
    name: "Collective",
    price: "Custom",
    description: "For partner hosts, concierges, and community-led birthday clubs.",
    features: ["Managed onboarding", "Operational insights", "White-glove support", "Custom referral deals"],
  },
];

export default function PricingPage() {
  return (
    <main className="container py-16">
      <div className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">Pricing</span>
        <h1 className="section-title mt-4">Simple pricing that matches the way birthdays actually get organized.</h1>
        <p className="mt-4 text-muted-foreground">
          Start free, upgrade when you run paid guest experiences, and keep refund safety built in from day one.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {tiers.map((tier) => (
          <Card key={tier.name} className={tier.featured ? "border-primary/30 shadow-glow" : ""}>
            <CardHeader>
              {tier.featured ? <Badge>Most popular</Badge> : null}
              <CardTitle className="pt-3 font-display text-3xl">{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 font-display text-5xl">{tier.price}</div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant={tier.featured ? "default" : "outline"}>
                Choose {tier.name}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
