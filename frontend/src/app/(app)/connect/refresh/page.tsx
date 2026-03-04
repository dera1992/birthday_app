import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConnectRefreshPage() {
  return (
    <div className="container py-16">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="font-display text-3xl">Additional onboarding details needed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Stripe asked for more information. Return to the payout dashboard and continue onboarding.</p>
          <Button asChild>
            <Link href="/connect">Resume setup</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
