import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner-native";

import { login, register } from "@/features/auth/api";
import { useAuth } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { login: authLogin } = useAuth();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { first_name: "", last_name: "", email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await register(values);
      const tokens = await login(values.email, values.password);
      await authLogin(tokens.access, tokens.refresh);
      toast.success("Account created! Welcome to Birthday Experiences.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not create account."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-slate-950"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerClassName="flex-grow px-6 pt-16 pb-10">
        <View className="mb-8">
          <View className="h-12 w-12 items-center justify-center rounded-[14px] bg-rose-600">
            <Text className="text-base font-bold text-white">CE</Text>
          </View>
          <Text className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">Create account</Text>
          <Text className="mt-1.5 text-base text-slate-500 dark:text-slate-400">
            Start with your birthday page — no card required.
          </Text>
        </View>

        <View className="gap-4">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="first_name"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="First name"
                    placeholder="Ada"
                    autoComplete="given-name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.first_name?.message}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="last_name"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Last name"
                    placeholder="Lovelace"
                    autoComplete="family-name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.last_name?.message}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Password"
                placeholder="Min. 8 characters"
                secureTextEntry
                autoComplete="new-password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />
        </View>

        <Button
          label="Create account"
          className="mt-6"
          loading={loading}
          onPress={handleSubmit(onSubmit)}
        />

        <Text className="mt-4 text-center text-xs text-slate-400">
          By signing up, you agree to our{" "}
          <Text className="underline">Terms of Service</Text> and{" "}
          <Text className="underline">Privacy Policy</Text>, including Cookie Use.
        </Text>

        <View className="mt-5 flex-row justify-center gap-1">
          <Text className="text-sm text-slate-500">Already have an account?</Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text className="text-sm font-semibold text-rose-600">Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
