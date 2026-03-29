import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner-native";

import { login } from "@/features/auth/api";
import { useAuth } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { login: authLogin } = useAuth();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const tokens = await login(values.email, values.password);
      await authLogin(tokens.access, tokens.refresh);
    } catch (err) {
      toast.error(getErrorMessage(err, "Invalid email or password."));
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
        {/* Brand mark */}
        <View className="mb-10">
          <View className="h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-rose-500 to-rose-700">
            <Text className="text-base font-bold text-white">CE</Text>
          </View>
          <Text className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">Welcome back</Text>
          <Text className="mt-1.5 text-base text-slate-500 dark:text-slate-400">
            Sign in to your Birthday Experiences account
          </Text>
        </View>

        <View className="gap-4">
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
                placeholder="Your password"
                secureTextEntry
                autoComplete="password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />
        </View>

        <Button
          label="Sign in"
          className="mt-6"
          loading={loading}
          onPress={handleSubmit(onSubmit)}
        />

        <View className="mt-6 flex-row justify-center gap-1">
          <Text className="text-sm text-slate-500">Don&apos;t have an account?</Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text className="text-sm font-semibold text-rose-600">Sign up</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
