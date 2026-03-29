import "../global.css";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { Slot, SplashScreen } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Toaster } from "sonner-native";

const GestureWrapper =
  Platform.OS === "web"
    ? ({ children, style }: { children: React.ReactNode; style?: object }) => (
        <View style={style}>{children}</View>
      )
    : GestureHandlerRootView;

import { AuthProvider } from "@/features/auth/auth-context";
import { STRIPE_PUBLISHABLE_KEY } from "@/constants/config";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureWrapper style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
            <AuthProvider>
              <Slot />
              <Toaster />
            </AuthProvider>
          </StripeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureWrapper>
  );
}
