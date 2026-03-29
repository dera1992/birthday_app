import { Text, TextInput, View, type TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <View className="gap-1.5">
      {label ? <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</Text> : null}
      <TextInput
        className={`rounded-xl border px-4 py-3 text-base text-slate-900 dark:text-white
          ${error
            ? "border-red-400 bg-red-50 dark:bg-red-950/20"
            : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
          }`}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}
