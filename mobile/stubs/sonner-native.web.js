// Web stub for sonner-native — use a no-op Toaster on web
const React = require("react");

const Toaster = () => null;
const toast = Object.assign(
  (message) => console.log("[toast]", message),
  {
    success: (msg) => console.log("[toast:success]", msg),
    error: (msg) => console.error("[toast:error]", msg),
    warning: (msg) => console.warn("[toast:warning]", msg),
    info: (msg) => console.info("[toast:info]", msg),
    loading: (msg) => console.log("[toast:loading]", msg),
    dismiss: () => {},
    promise: async (promise) => promise,
  }
);

module.exports = { Toaster, toast };
