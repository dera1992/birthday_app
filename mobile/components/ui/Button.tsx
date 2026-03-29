import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

interface ButtonProps extends PressableProps {
  label: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({ label, variant = "primary", size = "md", loading, disabled, ...props }: ButtonProps) {
  const base = "flex-row items-center justify-center rounded-2xl";
  const variants = {
    primary: "bg-rose-600 active:bg-rose-700",
    outline: "border border-rose-600 bg-transparent active:bg-rose-50",
    ghost: "bg-transparent active:bg-rose-50",
  };
  const sizes = {
    sm: "px-4 py-2",
    md: "px-5 py-3.5",
    lg: "px-6 py-4",
  };
  const textVariants = {
    primary: "text-white font-semibold",
    outline: "text-rose-600 font-semibold",
    ghost: "text-rose-600 font-semibold",
  };
  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-base",
  };

  return (
    <Pressable
      className={`${base} ${variants[variant]} ${sizes[size]} ${disabled || loading ? "opacity-50" : ""}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "primary" ? "#fff" : "#e11d48"} />
      ) : (
        <Text className={`${textVariants[variant]} ${textSizes[size]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
