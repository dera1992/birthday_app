import { Text, View } from "react-native";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "error";
}

export function Badge({ label, variant = "default" }: BadgeProps) {
  const variants = {
    default: "bg-slate-100 dark:bg-slate-800",
    success: "bg-emerald-100 dark:bg-emerald-900/30",
    warning: "bg-amber-100 dark:bg-amber-900/30",
    error: "bg-red-100 dark:bg-red-900/30",
  };
  const textVariants = {
    default: "text-slate-600 dark:text-slate-400",
    success: "text-emerald-700 dark:text-emerald-400",
    warning: "text-amber-700 dark:text-amber-400",
    error: "text-red-700 dark:text-red-400",
  };

  return (
    <View className={`rounded-full px-2.5 py-0.5 ${variants[variant]}`}>
      <Text className={`text-xs font-semibold ${textVariants[variant]}`}>{label}</Text>
    </View>
  );
}
