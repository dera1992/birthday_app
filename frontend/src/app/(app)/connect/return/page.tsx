import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConnectReturnPage() {
  return (
    <div className="container py-16">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="font-display text-3xl">Stripe returned successfully</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Head back to the Connect dashboard to refresh your payout status.</p>
          <Button asChild>
            <Link href="/connect">Back to Connect</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
