// Web stub for @stripe/stripe-react-native
// Stripe payments are handled by the web app (Next.js frontend) — not the mobile web view.
const noop = () => {};
const noopAsync = async () => ({});

module.exports = {
  StripeProvider: ({ children }) => children,
  useStripe: () => ({
    initPaymentSheet: noopAsync,
    presentPaymentSheet: noopAsync,
    confirmPayment: noopAsync,
    createPaymentMethod: noopAsync,
    handleURLCallback: noopAsync,
    retrievePaymentIntent: noopAsync,
    collectBankAccountForPayment: noopAsync,
  }),
  CardField: noop,
  CardForm: noop,
  PaymentSheet: noop,
  ApplePayButton: noop,
  GooglePayButton: noop,
  initStripe: noopAsync,
  confirmPayment: noopAsync,
  createPaymentMethod: noopAsync,
  retrievePaymentIntent: noopAsync,
  isApplePaySupported: false,
};
