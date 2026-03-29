import { View, type ViewProps } from "react-native";

export function Card({ className, children, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={`rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className ?? ""}`}
      {...props}
    >
      {children}
    </View>
  );
}
