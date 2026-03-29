import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Calendar, ChevronRight, Gift, Plus } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/auth-context";
import { useBirthdayProfile } from "@/features/birthday/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function CountdownCard({ days, isToday }: { days: number; isToday: boolean }) {
  return (
    <Card className={`items-center py-8 ${isToday ? "bg-rose-600" : "bg-slate-50 dark:bg-slate-900"}`}>
      {isToday ? (
        <>
          <Text className="text-5xl">🎂</Text>
          <Text className="mt-3 text-2xl font-bold text-white">Happy Birthday! 🎉</Text>
          <Text className="mt-1 text-rose-200">Today is your special day</Text>
        </>
      ) : (
        <>
          <Text className={`text-6xl font-bold ${days <= 7 ? "text-rose-600" : "text-slate-800 dark:text-white"}`}>
            {days}
          </Text>
          <Text className="mt-1 text-base text-slate-500 dark:text-slate-400">days until your birthday</Text>
        </>
      )}
    </Card>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const slug = user?.birthday_profile_slug ?? "";
  const { data: profile, isLoading } = useBirthdayProfile(slug);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between py-5">
          <View>
            <Text className="text-base text-slate-500 dark:text-slate-400">Good day,</Text>
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">
              {user?.first_name ?? "Celebrant"} 👋
            </Text>
          </View>
          {profile?.profile_photo_url ? (
            <Image
              source={{ uri: profile.profile_photo_url }}
              className="h-11 w-11 rounded-full"
            />
          ) : (
            <View className="h-11 w-11 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950">
              <Text className="text-base font-bold text-rose-600">
                {user?.first_name?.[0] ?? "?"}
              </Text>
            </View>
          )}
        </View>

        {/* Birthday countdown / no profile */}
        {!isLoading && !slug ? (
          <Card className="items-center gap-3 py-8">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950">
              <Calendar size={28} color="#e11d48" />
            </View>
            <Text className="text-lg font-semibold text-slate-800 dark:text-white">Set up your birthday page</Text>
            <Text className="text-center text-sm text-slate-500">
              Create your birthday profile so friends can find you and send gifts.
            </Text>
            <Button label="Create birthday page" onPress={() => router.push("/birthday-profile/new" as never)} />
          </Card>
        ) : null}

        {profile ? (
          <>
            <CountdownCard days={profile.days_until_birthday} isToday={profile.is_birthday_today} />

            {/* Quick links */}
            <Text className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">Quick actions</Text>
            <View className="gap-3">
              {[
                { icon: Gift, label: "Browse digital gifts", sub: "Send a gift to a friend", route: "/(tabs)/gifts" },
                { icon: Calendar, label: "My birthday page", sub: `/${profile.slug}`, route: `/birthday/${profile.slug}` },
              ].map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => router.push(item.route as never)}
                  className="flex-row items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 active:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950">
                    <item.icon size={20} color="#e11d48" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-slate-800 dark:text-white">{item.label}</Text>
                    <Text className="text-sm text-slate-400">{item.sub}</Text>
                  </View>
                  <ChevronRight size={18} color="#cbd5e1" />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
