import { ScrollView, View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenProps extends ViewProps {
  scroll?: boolean;
  padded?: boolean;
}

export function Screen({ scroll = false, padded = true, children, className, ...props }: ScreenProps) {
  const padding = padded ? "px-4" : "";

  if (scroll) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["bottom"]}>
        <ScrollView
          className="flex-1"
          contentContainerClassName={`${padding} pb-8`}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["bottom"]}>
      <View className={`flex-1 ${padding} ${className ?? ""}`} {...props}>
        {children}
      </View>
    </SafeAreaView>
  );
}
