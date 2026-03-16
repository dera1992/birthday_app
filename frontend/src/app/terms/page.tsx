import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions — Birthday Experiences",
  description: "The terms and conditions governing your use of the Birthday Experiences platform.",
};

const LAST_UPDATED = "15 March 2026";

export default function TermsPage() {
  return (
    <main className="container py-16">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="eyebrow">Legal</span>
          <h1 className="section-title mt-4">Terms &amp; Conditions</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="mt-14 space-y-10">

          <section>
            <h2 className="font-display text-xl font-bold">1. Acceptance of terms</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              By accessing or using Birthday Experiences (&quot;the platform&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;), you agree to
              be bound by these Terms &amp; Conditions. If you do not agree, please do not use the platform.
              These terms apply to all users including celebrants, guests, and event hosts.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">2. Description of service</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Birthday Experiences provides:
            </p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              {[
                "Birthday profile pages with countdown, wishlist, messaging, and a digital gift store.",
                "Event creation and paid guest registration with escrow-protected payments.",
                "Digital gift customisation and delivery (cards, flowers, badges, animated messages, AI-generated gifts).",
                "Wallet and payout services for celebrants and event hosts via Stripe Connect.",
              ].map((item) => (
                <li key={item} className="flex gap-3 leading-7">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">3. Accounts</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              You must be at least 18 years old to create an account. You are responsible for keeping
              your login credentials secure and for all activity that occurs under your account. Notify us
              immediately at support@birthdayexperiences.com if you suspect unauthorised access.
            </p>
            <p className="mt-3 leading-7 text-muted-foreground">
              We reserve the right to suspend or terminate accounts that violate these terms, engage in
              fraudulent activity, or cause harm to other users.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">4. Payments and fees</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              All payments are processed by Stripe. By making or receiving a payment on the platform, you
              also agree to{" "}
              <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" className="text-rose-600 underline underline-offset-2 hover:text-rose-700 dark:text-rose-400">
                Stripe&apos;s terms of service
              </a>.
            </p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li className="flex gap-3 leading-7"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" /><span><strong className="text-foreground">Platform fee:</strong> Birthday Experiences deducts a platform fee from each transaction. The current fee is displayed at the point of purchase.</span></li>
              <li className="flex gap-3 leading-7"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" /><span><strong className="text-foreground">Stripe processing fee:</strong> Stripe deducts its own processing fee from transactions in accordance with their pricing.</span></li>
              <li className="flex gap-3 leading-7"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" /><span><strong className="text-foreground">Fraud buffer:</strong> Earnings are held for 5 days before becoming available for withdrawal as a fraud prevention measure.</span></li>
              <li className="flex gap-3 leading-7"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" /><span><strong className="text-foreground">Escrow:</strong> Event ticket payments are held in escrow until the event reaches its lock deadline. If the event does not lock, payments are refunded in full.</span></li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">5. Refunds</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Digital gifts are delivered instantly and are non-refundable once sent. Event ticket
              refunds are governed by the refund policy set by the event host at the time of purchase.
              Where an event does not lock, all guests are refunded automatically. Wishlist contributions
              are non-refundable once the contribution has been credited to the celebrant&apos;s wallet.
            </p>
            <p className="mt-3 leading-7 text-muted-foreground">
              If you believe a charge was made in error, contact us at support@birthdayexperiences.com
              within 14 days of the transaction.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">6. User content</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              You retain ownership of content you upload (photos, messages, profile information). By
              posting content on the platform, you grant us a limited, non-exclusive, royalty-free
              licence to display that content as part of delivering the service.
            </p>
            <p className="mt-3 leading-7 text-muted-foreground">
              You must not post content that is unlawful, defamatory, abusive, obscene, or that
              infringes the intellectual property rights of others. We may remove content that violates
              these rules without prior notice.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">7. Prohibited conduct</h2>
            <p className="mt-3 leading-7 text-muted-foreground">You must not:</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              {[
                "Use the platform for any unlawful purpose or in a way that violates any applicable law.",
                "Impersonate another person or entity.",
                "Attempt to gain unauthorised access to any part of the platform or another user's account.",
                "Use automated tools (bots, scrapers) to access the platform without our written permission.",
                "Submit fraudulent payment disputes or deliberately trigger chargebacks without genuine cause.",
                "Harass, threaten, or abuse other users.",
              ].map((item) => (
                <li key={item} className="flex gap-3 leading-7">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">8. Connect payouts (hosts and celebrants)</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              To withdraw funds, you must complete Stripe Connect onboarding. By doing so, you agree to
              Stripe&apos;s Connected Account Agreement. We are not responsible for delays or failures in
              payouts caused by Stripe&apos;s systems or due to incomplete identity verification.
            </p>
            <p className="mt-3 leading-7 text-muted-foreground">
              We reserve the right to withhold payouts pending investigation where fraudulent activity
              is suspected.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">9. Intellectual property</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              All platform software, design, graphics, and content created by Birthday Experiences are
              our intellectual property and may not be copied, reproduced, or distributed without our
              written permission. Gift templates and assets uploaded by administrators remain the
              property of their respective owners.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">10. Limitation of liability</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              To the fullest extent permitted by law, Birthday Experiences is not liable for any
              indirect, incidental, or consequential loss arising from your use of the platform,
              including but not limited to loss of earnings, data loss, or failed events. Our total
              liability to you shall not exceed the total fees you have paid to us in the 12 months
              prior to the claim.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">11. Governing law</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              These terms are governed by the laws of England and Wales. Any disputes shall be subject
              to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">12. Changes to these terms</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              We may update these terms from time to time. We will notify you of material changes by
              email or through a notice in the platform at least 14 days before they take effect.
              Continued use of the platform after changes take effect constitutes acceptance of the
              updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">13. Contact</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              If you have any questions about these terms, contact us at{" "}
              <a href="mailto:legal@birthdayexperiences.com" className="text-rose-600 underline underline-offset-2 hover:text-rose-700 dark:text-rose-400">
                legal@birthdayexperiences.com
              </a>.
            </p>
          </section>

        </div>

        <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-8 text-sm text-muted-foreground">
          <Link href="/about" className="hover:text-foreground">About us</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy policy</Link>
        </div>
      </div>
    </main>
  );
}
