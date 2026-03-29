import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

import { useGiftCatalog } from "@/features/gifts/api";
import type { GiftCategory, GiftProduct } from "@/features/gifts/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const CATEGORIES: { label: string; value: GiftCategory | "" }[] = [
  { label: "All", value: "" },
  { label: "Cards 🎴", value: "CARD" },
  { label: "Flowers 🌸", value: "FLOWER" },
  { label: "Messages 💌", value: "MESSAGE" },
  { label: "Badges 🏅", value: "BADGE" },
  { label: "Videos 🎬", value: "VIDEO" },
];

function formatCurrency(amount: string, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number(amount));
}

function GiftCard({ product, onPress }: { product: GiftProduct; onPress: () => void }) {
  const imageUrl = product.catalog_preview_asset_url || product.preview_asset_url;

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 overflow-hidden rounded-2xl border border-slate-100 bg-white active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900"
      style={{ width: "48%" }}
    >
      <View className="h-44 w-full bg-rose-50 dark:bg-rose-950/30">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-4xl">🎁</Text>
          </View>
        )}
      </View>
      <View className="p-3">
        <Text className="font-semibold text-slate-800 dark:text-white" numberOfLines={1}>
          {product.name}
        </Text>
        {product.description ? (
          <Text className="mt-0.5 text-xs text-slate-400" numberOfLines={2}>{product.description}</Text>
        ) : null}
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(product.price, product.currency)}
          </Text>
          <Badge label={product.category} />
        </View>
      </View>
    </Pressable>
  );
}

export default function GiftsScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<GiftCategory | "">("");
  const { data: products, isLoading } = useGiftCatalog(activeCategory || undefined);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top"]}>
      {/* Header */}
      <View className="px-4 pt-5 pb-3">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">Digital Gifts</Text>
        <Text className="mt-0.5 text-sm text-slate-500">Send something beautiful, instantly</Text>
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 pb-4 gap-2"
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.value}
            onPress={() => setActiveCategory(cat.value as GiftCategory | "")}
            className={`rounded-full px-4 py-2 ${
              activeCategory === cat.value
                ? "bg-rose-600"
                : "border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeCategory === cat.value ? "text-white" : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Grid */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#e11d48" />
        </View>
      ) : (
        <FlatList
          data={products ?? []}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperClassName="justify-between px-4"
          contentContainerClassName="pb-10 pt-2"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <GiftCard
              product={item}
              onPress={() => router.push(`/gifts/${item.id}` as never)}
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-4xl">🎁</Text>
              <Text className="mt-3 text-base font-semibold text-slate-600 dark:text-slate-400">
                No gifts in this category yet
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
