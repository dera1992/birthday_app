import Link from "next/link";

export const metadata = {
  title: "About — Birthday Experiences",
  description: "Learn about Birthday Experiences — the platform built to make every birthday feel fully celebrated.",
};

export default function AboutPage() {
  return (
    <main className="container py-16">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center">
          <span className="eyebrow">About us</span>
          <h1 className="section-title mt-4">
            Built for the people who make birthdays matter
          </h1>
          <p className="mt-4 text-muted-foreground">
            Birthday Experiences started with a simple belief: every birthday deserves to feel fully celebrated —
            not just planned, but remembered.
          </p>
        </div>

        {/* Story */}
        <div className="mt-16 space-y-10">
          <section>
            <h2 className="font-display text-2xl font-bold">Our story</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              We noticed that birthday planning was fragmented. People were juggling spreadsheets for RSVPs,
              bank transfers for group contributions, and group chats for messages — all while trying to keep
              the surprise intact. Hosts were losing money when events fell through. Guests had no safe way to
              send gifts or contribute to wishlists without handing over cash awkwardly.
            </p>
            <p className="mt-4 leading-7 text-muted-foreground">
              Birthday Experiences was built to bring all of that into one trusted platform. A place where
              the celebrant has a beautiful page, guests can gift and contribute safely, hosts get paid
              automatically, and everyone walks away with a warm memory.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">What we do</h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {[
                {
                  title: "Birthday pages",
                  body: "Every celebrant gets a personalised page — countdown, wishlist, messages, and a digital gift store, all in one place.",
                },
                {
                  title: "Protected payments",
                  body: "Guest contributions and ticket sales are held in escrow until the event locks in, so no one loses money if plans change.",
                },
                {
                  title: "Instant digital gifts",
                  body: "Send beautifully designed cards, flower animations, badges, and AI-generated gifts — delivered the moment payment clears.",
                },
                {
                  title: "Host payouts",
                  body: "Celebrants and hosts connect their bank via Stripe and withdraw earnings directly to their account — no platform delays.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-background/80 p-5">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">Our values</h2>
            <ul className="mt-4 space-y-3 text-muted-foreground">
              {[
                { label: "Trust first", body: "Every payment is protected. Every payout is transparent." },
                { label: "Warmth in every detail", body: "We obsess over small moments — the right font on a card, the right message at the right time." },
                { label: "Built for the celebrant", body: "Features exist to make the person being celebrated feel seen, not just organised." },
                { label: "Simple over clever", body: "We resist complexity. If it takes more than a tap to do something important, we simplify it." },
              ].map((v) => (
                <li key={v.label} className="flex gap-3 leading-7">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                  <span><strong className="text-foreground">{v.label}.</strong> {v.body}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-rose-50 px-8 py-8 dark:bg-rose-950/20">
            <h2 className="font-display text-2xl font-bold">Get in touch</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              We are a small team and we read every message. Whether you have a question, a feature idea,
              or just want to say hello — reach out.
            </p>
            <p className="mt-4 text-sm font-medium text-rose-600 dark:text-rose-400">
              hello@celnoia.com
            </p>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-14 flex flex-wrap gap-4 border-t border-border pt-8 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">Privacy policy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms &amp; conditions</Link>
          <Link href="/register" className="hover:text-foreground">Create an account</Link>
        </div>
      </div>
    </main>
  );
}
