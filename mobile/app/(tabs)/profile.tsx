import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Gift,
  HelpCircle,
  LogOut,
  Settings,
  Shield,
  FileText,
  Info,
} from "lucide-react-native";

import { useAuth } from "@/features/auth/auth-context";

function MenuItem({
  icon: Icon,
  label,
  onPress,
  destructive = false,
}: {
  icon: React.ElementType;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 active:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
    >
      <View className={`h-9 w-9 items-center justify-center rounded-xl ${destructive ? "bg-red-100 dark:bg-red-950" : "bg-slate-100 dark:bg-slate-800"}`}>
        <Icon size={18} color={destructive ? "#ef4444" : "#64748b"} />
      </View>
      <Text className={`flex-1 font-medium ${destructive ? "text-red-500" : "text-slate-700 dark:text-slate-300"}`}>
        {label}
      </Text>
      <ChevronRight size={16} color="#cbd5e1" />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const slug = user?.birthday_profile_slug;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="py-5">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">Profile</Text>
        </View>

        {/* User card */}
        <View className="mb-6 flex-row items-center gap-4 rounded-2xl bg-rose-50 p-5 dark:bg-rose-950/20">
          {false ? (
            <Image source={{ uri: "" }} className="h-16 w-16 rounded-full" />
          ) : (
            <View className="h-16 w-16 items-center justify-center rounded-full bg-rose-200 dark:bg-rose-800">
              <Text className="text-2xl font-bold text-rose-700 dark:text-rose-200">
                {user?.first_name?.[0] ?? "?"}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              {user?.first_name} {user?.last_name}
            </Text>
            <Text className="text-sm text-slate-500">{user?.email}</Text>
            {slug ? (
              <Text className="mt-0.5 text-xs text-rose-500">/{slug}</Text>
            ) : null}
          </View>
        </View>

        <View className="gap-3">
          <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Account</Text>
          <MenuItem
            icon={Gift}
            label="Birthday profile"
            onPress={() => slug
              ? router.push(`/birthday/${slug}` as never)
              : router.push("/birthday-profile/new" as never)
            }
          />
          <MenuItem
            icon={Settings}
            label="Settings"
            onPress={() => router.push("/settings" as never)}
          />

          <Text className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Legal</Text>
          <MenuItem icon={Shield} label="Privacy policy" onPress={() => {}} />
          <MenuItem icon={FileText} label="Terms & conditions" onPress={() => {}} />
          <MenuItem icon={Info} label="About us" onPress={() => {}} />

          <Text className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Support</Text>
          <MenuItem icon={HelpCircle} label="Help & support" onPress={() => {}} />
          <MenuItem icon={LogOut} label="Sign out" onPress={logout} destructive />
        </View>

        <Text className="mt-8 text-center text-xs text-slate-300 dark:text-slate-700">
          Birthday Experiences v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
