import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "lucide-react-native";
import { toast } from "sonner-native";

import { useCreateBirthdayProfile } from "@/features/birthday/api";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getErrorMessage } from "@/lib/api/client";

export default function NewBirthdayProfileScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const createProfile = useCreateBirthdayProfile();

  const [dob, setDob] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [dobError, setDobError] = useState("");

  function validateDob(value: string) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(value)) return "Use format YYYY-MM-DD";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "Enter a valid date";
    if (date > new Date()) return "Date must be in the past";
    return "";
  }

  async function handleSubmit() {
    const error = validateDob(dob);
    if (error) { setDobError(error); return; }
    setDobError("");
    try {
      await createProfile.mutateAsync({ date_of_birth: dob, bio: bio.trim(), is_public: isPublic });
      await refreshUser();
      toast.success("Birthday profile created!");
      router.replace("/(tabs)" as never);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create profile."));
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerClassName="px-4 pb-10 pt-6" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="mb-8 items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950">
              <Calendar size={32} color="#e11d48" />
            </View>
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">Create your birthday page</Text>
            <Text className="mt-1.5 text-center text-sm text-slate-500 dark:text-slate-400">
              Let friends find you and celebrate your special day
            </Text>
          </View>

          <View className="gap-4">
            <Input
              label="Date of birth"
              placeholder="YYYY-MM-DD"
              value={dob}
              onChangeText={(v) => { setDob(v); setDobError(""); }}
              error={dobError}
              keyboardType="numeric"
            />

            <View>
              <Text className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Bio (optional)</Text>
              <TextInput
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Tell people a little about yourself..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                value={bio}
                onChangeText={setBio}
                textAlignVertical="top"
              />
            </View>

            {/* Public toggle */}
            <View className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800">
              <View>
                <Text className="font-medium text-slate-800 dark:text-white">Public profile</Text>
                <Text className="text-xs text-slate-400">Anyone can find and view your page</Text>
              </View>
              <Button
                label={isPublic ? "Public" : "Private"}
                variant={isPublic ? "primary" : "outline"}
                onPress={() => setIsPublic(!isPublic)}
              />
            </View>
          </View>

          <Button
            label={createProfile.isPending ? "Creating..." : "Create birthday page 🎂"}
            onPress={handleSubmit}
            className="mt-8"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
