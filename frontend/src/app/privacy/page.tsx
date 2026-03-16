import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Birthday Experiences",
  description: "How Birthday Experiences collects, uses, and protects your personal data.",
};

const LAST_UPDATED = "15 March 2026";

export default function PrivacyPolicyPage() {
  return (
    <main className="container py-16">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="eyebrow">Legal</span>
          <h1 className="section-title mt-4">Privacy Policy</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-slate dark:prose-invert mt-14 max-w-none">

          <section className="mb-10">
            <h2 className="font-display text-xl font-bold">1. Who we are</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Birthday Experiences (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the Birthday Experiences platform, accessible
              at birthdayexperiences.com. We are the data controller for personal data collected through
              this platform. If you have any questions about this policy, contact us at
              privacy@birthdayexperiences.com.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-display text-xl font-bold">2. What data we collect</h2>
            <p className="mt-3 leading-7 text-muted-foreground">We collect the following categories of data:</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              {[
                { label: "Account data", body: "Name, email address, phone number, and password (stored as a secure hash) when you register." },
                { label: "Profile data", body: "Date of birth, bio, interests, and any other information you add to your birthday profile." },
                { label: "Payment data", body: "We do not store raw card numbers. Payments are processed by Stripe. We store transaction references, amounts, and payout records." },
                { label: "Gift and wishlist data", body: "Customisation data entered when sending gifts (recipient name, message, sender name), wishlist items, and contribution amounts." },
                { label: "Usage data", body: "Pages visited, features used, device type, browser, and IP address collected automatically for security and analytics." },
                { label: "Communications", body: "Messages you send to other users on the platform, and any support requests you submit to us." },
              ].map((item) => (
                <li key={item.label} className="flex gap-3 leading-7">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span><strong className="text-foreground">{item.label}:</strong> {item.body}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="font-display text-xl font-bold">3. How we use your data</h2>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              {[
                "To create and manage your account and birthday profile.",
                "To process payments and payouts via Stripe.",
                "To send transactional emails such as payment confirmations, gift delivery notifications, and event updates.",
                "To display your profile to guests you share your link with.",
                "To improve the platform through aggregated, anonymised analytics.",
                "To comply with legal obligations, including fraud prevention and tax reporting.",
              ].map((item) => (
                <li key={item} className="flex gap-3 leading-7">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="font-display text-xl font-bold">4. Legal basis for processing</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              We process your data on the following legal bases under UK GDPR:
            </p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li className="flex gap-3 leading-7"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" /><span><strong className="text-foreground">Contract:</strong> Processing necessary to deliver the services you signed up for.</span></li>
              <li className="flex gap-3 leading-7"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" /><span><strong className="text-foreground">Legitimate interests:</strong> Platform security, fraud prevention, and product improvement.</span></li>
              <li className="flex gap-3 leading-7"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" /><span><strong className="text-foreground">Legal obligation:</strong> Compliance with financial regulations and law enforcement requests where required.</span></li>
              <li className="flex gap-3 leading-7"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" /><span><strong className="text-foreground">Consent:</strong> Marketing communications, where you have opted in.</span></li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="font-display text-xl font-bold">5. Data sharing</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              We do not sell your personal data. We share data only with:
            </p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li className="flex gap-3 leading-7"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" /><span><strong className="text-foreground">Stripe:</strong> For payment processing and Connect onboarding.</span></li>
              <li className="flex gap-3 leading-7"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" /><span><strong className="text-foreground">Cloud infrastructure providers:</strong> Servers that host the platform under strict data processing agreements.</span></li>
              <li className="flex gap-3 leading-7"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" /><span><strong className="text-foreground">Email delivery services:</strong> Used solely to send transactional emails on our behalf.</span></li>
              <li className="flex gap-3 leading-7"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" /><span><strong className="text-foreground">Legal authorities:</strong> Where required by law or to protect the rights and safety of our users.</span></li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="font-display text-xl font-bold">6. Data retention</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              We retain your account data for as long as your account is active. If you close your account,
              we delete your personal data within 90 days, except where we are required to retain it for
              legal or financial compliance purposes (typically 7 years for transaction records).
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-display text-xl font-bold">7. Your rights</h2>
            <p className="mt-3 leading-7 text-muted-foreground">Under UK GDPR you have the right to:</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              {[
                "Access a copy of the personal data we hold about you.",
                "Correct inaccurate data.",
                "Request deletion of your data (right to erasure).",
                "Object to or restrict certain types of processing.",
                "Data portability — receive your data in a structured, machine-readable format.",
                "Withdraw consent at any time where processing is based on consent.",
              ].map((item) => (
                <li key={item} className="flex gap-3 leading-7">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 leading-7 text-muted-foreground">
              To exercise any of these rights, email us at privacy@birthdayexperiences.com. We will
              respond within 30 days. You also have the right to lodge a complaint with the Information
              Commissioner&apos;s Office (ICO) at ico.org.uk.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-display text-xl font-bold">8. Cookies</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              We use essential cookies to keep you logged in and maintain your session. We do not use
              third-party advertising or tracking cookies. You can disable cookies in your browser settings,
              but this may prevent you from signing in.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-display text-xl font-bold">9. Security</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              We use industry-standard security measures including HTTPS encryption, hashed password
              storage, and access controls. No system is completely secure, and we encourage you to use
              a strong, unique password and to keep your account credentials private.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-display text-xl font-bold">10. Changes to this policy</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              We may update this policy from time to time. We will notify you of significant changes by
              email or by displaying a notice in the platform. The &quot;last updated&quot; date at the top of this
              page reflects the most recent revision.
            </p>
          </section>

        </div>

        <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-8 text-sm text-muted-foreground">
          <Link href="/about" className="hover:text-foreground">About us</Link>
          <Link href="/terms" className="hover:text-foreground">Terms &amp; conditions</Link>
        </div>
      </div>
    </main>
  );
}
