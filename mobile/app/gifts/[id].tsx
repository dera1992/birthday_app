import { ActivityIndicator, Image, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useStripe } from "@stripe/stripe-react-native";
import { toast } from "sonner-native";

import { useGiftCatalog, useCreateGiftIntent } from "@/features/gifts/api";
import { useAuth } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

type Step = "customize" | "payment" | "success";

function formatCurrency(amount: string, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number(amount));
}

export default function GiftDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const { data: products, isLoading } = useGiftCatalog();
  const product = products?.find((p) => String(p.id) === id);

  // We need the slug of the birthday profile being gifted to.
  // In a real flow this comes from navigation params; here we ask the user.
  const [profileSlug, setProfileSlug] = useState("");
  const createIntent = useCreateGiftIntent(profileSlug);

  const [step, setStep] = useState<Step>("customize");
  const [fromName, setFromName] = useState(
    isAuthenticated ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() : ""
  );
  const [message, setMessage] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator size="large" color="#e11d48" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <Text className="text-slate-500">Gift not found.</Text>
      </SafeAreaView>
    );
  }

  const imageUrl = product.catalog_preview_asset_url || product.preview_asset_url;

  async function handleCustomizeSubmit() {
    if (!profileSlug.trim()) {
      toast.error("Enter the birthday profile username.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createIntent.mutateAsync({
        product_slug: product!.slug,
        from_name: isAnonymous ? "" : fromName,
        custom_message: message,
        visibility: "PUBLIC",
        buyer_name: isAnonymous ? "Anonymous" : (isAuthenticated ? `${user?.first_name} ${user?.last_name}`.trim() : buyerName),
        buyer_email: isAuthenticated ? (user?.email ?? "") : buyerEmail,
        is_anonymous: isAnonymous,
        customization_data: { sender_name: fromName, message },
      });

      await initPaymentSheet({
        paymentIntentClientSecret: res.client_secret,
        merchantDisplayName: "Birthday Experiences",
        defaultBillingDetails: {
          name: isAuthenticated ? `${user?.first_name} ${user?.last_name}`.trim() : buyerName,
          email: isAuthenticated ? user?.email : buyerEmail,
        },
      });

      const { error } = await presentPaymentSheet();
      if (error) {
        toast.error(error.message);
        return;
      }
      setStep("success");
      toast.success("Gift sent! 🎁");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not process gift."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top", "bottom"]}>
      <ScrollView
        contentContainerClassName="px-4 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Product image */}
        <View className="mt-4 h-56 w-full overflow-hidden rounded-3xl bg-rose-50 dark:bg-rose-950/30">
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-7xl">🎁</Text>
            </View>
          )}
        </View>

        <View className="mt-4 flex-row items-start justify-between">
          <Text className="flex-1 text-2xl font-bold text-slate-900 dark:text-white">{product.name}</Text>
          <Text className="text-xl font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(product.price, product.currency)}
          </Text>
        </View>
        {product.description ? (
          <Text className="mt-1.5 text-sm text-slate-500">{product.description}</Text>
        ) : null}

        {step === "success" ? (
          <Card className="mt-8 items-center gap-3 py-10">
            <Text className="text-6xl">🎉</Text>
            <Text className="text-xl font-bold text-slate-800 dark:text-white">Gift sent!</Text>
            <Text className="text-center text-sm text-slate-500">
              Your gift has been delivered to the birthday page.
            </Text>
            <Button label="Send another gift" variant="outline" onPress={() => {
              setStep("customize");
              setMessage("");
              setFromName(isAuthenticated ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() : "");
            }} />
            <Button label="Back to gifts" onPress={() => router.back()} />
          </Card>
        ) : (
          <View className="mt-6 gap-4">
            <Text className="text-base font-bold text-slate-800 dark:text-white">Send this gift</Text>

            <Input
              label="Birthday profile username"
              placeholder="e.g. ada-lovelace"
              autoCapitalize="none"
              value={profileSlug}
              onChangeText={setProfileSlug}
            />

            <Input
              label={isAnonymous ? "From (hidden)" : "From"}
              placeholder="Your name"
              value={fromName}
              onChangeText={setFromName}
              editable={!isAnonymous}
            />

            <Input
              label="Message"
              placeholder="Write a birthday message..."
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
            />

            {!isAuthenticated ? (
              <>
                <Input label="Your name" placeholder="Full name" value={buyerName} onChangeText={setBuyerName} />
                <Input label="Your email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={buyerEmail} onChangeText={setBuyerEmail} />
              </>
            ) : null}

            {/* Anonymous toggle */}
            <Button
              label={isAnonymous ? "Sending anonymously — tap to show name" : "Send anonymously"}
              variant={isAnonymous ? "primary" : "outline"}
              onPress={() => setIsAnonymous((v) => !v)}
            />

            <Button
              label={`Pay ${formatCurrency(product.price, product.currency)} & send`}
              loading={submitting}
              onPress={handleCustomizeSubmit}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
