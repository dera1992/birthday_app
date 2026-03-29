import { useState } from "react";
import {
  ActivityIndicator, Image, Pressable, ScrollView,
  Text, TextInput, View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Gift, MessageCircle, Send } from "lucide-react-native";
import { toast } from "sonner-native";

import {
  useBirthdayProfile,
  useBirthdayMessages,
  usePublicWishlist,
  usePostMessage,
} from "@/features/birthday/api";
import { useBirthdayGifts, useGiftCatalog } from "@/features/gifts/api";
import { useAuth } from "@/features/auth/auth-context";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/lib/api/client";

type TabId = "wishlist" | "messages" | "gifts";

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "wishlist", label: "Wishlist", emoji: "🎀" },
  { id: "messages", label: "Messages", emoji: "💬" },
  { id: "gifts", label: "Digital Gifts", emoji: "🎁" },
];

function formatCurrency(amount: string | null, currency: string) {
  if (!amount) return "";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number(amount));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function BirthdayProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("wishlist");
  const [msgName, setMsgName] = useState("");
  const [msgContent, setMsgContent] = useState("");

  const { data: profile, isLoading } = useBirthdayProfile(slug);
  const { data: wishlist = [] } = usePublicWishlist(slug);
  const { data: messages = [] } = useBirthdayMessages(slug);
  const { data: gifts = [] } = useBirthdayGifts(slug);
  const { data: catalog = [] } = useGiftCatalog();
  const postMessage = usePostMessage(slug);

  async function handleSendMessage() {
    const name = msgName.trim() || user?.first_name + " " + user?.last_name || "Anonymous";
    const content = msgContent.trim();
    if (!content) return;
    try {
      await postMessage.mutateAsync({ author_name: name, content });
      setMsgContent("");
      setMsgName("");
      toast.success("Message sent! It will appear after approval.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to send message."));
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator size="large" color="#e11d48" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <Text className="text-slate-500">Birthday profile not found.</Text>
      </SafeAreaView>
    );
  }

  const approvedMessages = messages.filter((m) => m.is_approved);
  const publicGifts = gifts.filter((g) => g.visibility === "PUBLIC");

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        {/* Cover */}
        <View className="h-48 bg-rose-500">
          {profile.cover_photo_url ? (
            <Image source={{ uri: profile.cover_photo_url }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-7xl">🎂</Text>
            </View>
          )}
        </View>

        {/* Avatar + Info */}
        <View className="px-4">
          <View className="-mt-10 mb-4 flex-row items-end gap-4">
            {profile.profile_photo_url ? (
              <Image
                source={{ uri: profile.profile_photo_url }}
                className="h-20 w-20 rounded-2xl border-4 border-white dark:border-slate-950"
              />
            ) : (
              <View className="h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-rose-100 dark:border-slate-950 dark:bg-rose-950">
                <Text className="text-3xl font-bold text-rose-600">{profile.full_name?.[0] ?? "?"}</Text>
              </View>
            )}
            <View className="flex-1 pb-1">
              <Text className="text-xl font-bold text-slate-900 dark:text-white">{profile.full_name}</Text>
              <Text className="text-sm text-slate-500">@{profile.slug}</Text>
            </View>
          </View>

          {/* Countdown */}
          <Card
            className="mb-4 flex-row items-center gap-4"
            style={profile.is_birthday_today ? { backgroundColor: "#e11d48" } : undefined}
          >
            <Calendar size={24} color={profile.is_birthday_today ? "#fff" : "#e11d48"} />
            <View>
              {profile.is_birthday_today ? (
                <Text className="text-base font-bold text-white">🎉 Today is the big day!</Text>
              ) : (
                <>
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: profile.days_until_birthday <= 7 ? "#e11d48" : "#1e293b" }}
                  >
                    {profile.days_until_birthday} days
                  </Text>
                  <Text className="text-sm text-slate-500">until birthday</Text>
                </>
              )}
            </View>
          </Card>

          {profile.bio ? (
            <Text className="mb-4 leading-6 text-slate-600 dark:text-slate-400">{profile.bio}</Text>
          ) : null}

          {/* Tabs */}
          <View className="mb-4 flex-row rounded-2xl border border-slate-100 bg-slate-50 p-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  className="flex-1 items-center rounded-xl py-2.5"
                  style={isActive ? { backgroundColor: "white" } : undefined}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: isActive ? "#e11d48" : "#94a3b8" }}
                  >
                    {tab.emoji} {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Wishlist Tab */}
          {activeTab === "wishlist" && (
            <View className="gap-3">
              {wishlist.length === 0 ? (
                <View className="items-center py-10">
                  <Text className="text-4xl">🎀</Text>
                  <Text className="mt-2 text-slate-400">No wishlist items yet.</Text>
                </View>
              ) : (
                wishlist.map((item) => (
                  <Card key={item.id} style={item.is_reserved ? { opacity: 0.6 } : undefined}>
                    <View className="flex-row gap-3">
                      {item.image_url ? (
                        <Image source={{ uri: item.image_url }} className="h-14 w-14 rounded-xl" resizeMode="cover" />
                      ) : (
                        <View className="h-14 w-14 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950">
                          <Gift size={22} color="#e11d48" />
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="font-semibold text-slate-800 dark:text-white" numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.description ? (
                          <Text className="text-xs text-slate-400" numberOfLines={2}>{item.description}</Text>
                        ) : null}
                        {item.price ? (
                          <Text className="mt-1 text-sm font-bold text-rose-600 dark:text-rose-400">
                            {formatCurrency(item.price, item.currency)}
                          </Text>
                        ) : null}
                      </View>
                      {item.is_reserved && (
                        <View className="self-start rounded-full bg-emerald-100 px-2.5 py-0.5">
                          <Text className="text-xs font-semibold text-emerald-700">Reserved</Text>
                        </View>
                      )}
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <View className="gap-3">
              {/* Send message form */}
              <Card>
                <Text className="mb-3 font-semibold text-slate-800 dark:text-white">Leave a message 💬</Text>
                {!user && (
                  <TextInput
                    className="mb-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="Your name"
                    placeholderTextColor="#94a3b8"
                    value={msgName}
                    onChangeText={setMsgName}
                  />
                )}
                <TextInput
                  className="mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder={`Write a birthday message for ${profile.full_name}...`}
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  value={msgContent}
                  onChangeText={setMsgContent}
                  textAlignVertical="top"
                />
                <Button
                  label={postMessage.isPending ? "Sending..." : "Send message"}
                  onPress={handleSendMessage}
                  variant="primary"
                />
              </Card>

              {approvedMessages.length === 0 ? (
                <View className="items-center py-8">
                  <Text className="text-4xl">💬</Text>
                  <Text className="mt-2 text-slate-400">No messages yet. Be the first!</Text>
                </View>
              ) : (
                approvedMessages.map((msg) => (
                  <Card key={msg.id}>
                    <View className="flex-row items-start gap-3">
                      <View className="h-9 w-9 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950">
                        <Text className="text-sm font-bold text-rose-600">{msg.author_name?.[0]?.toUpperCase() ?? "?"}</Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="font-semibold text-slate-800 dark:text-white">{msg.author_name}</Text>
                          <Text className="text-xs text-slate-400">{formatDate(msg.created_at)}</Text>
                        </View>
                        <Text className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">{msg.content}</Text>
                        {msg.replies?.length > 0 && msg.replies.map((reply) => (
                          <View key={reply.id} className="mt-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                            <Text className="text-xs font-semibold text-rose-600">{reply.author_name}</Text>
                            <Text className="mt-0.5 text-xs text-slate-500">{reply.content}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}

          {/* Digital Gifts Tab */}
          {activeTab === "gifts" && (
            <View className="gap-4">
              {/* Gift catalog */}
              <Text className="font-semibold text-slate-800 dark:text-white">Send a gift 🎁</Text>
              <View className="flex-row flex-wrap gap-3">
                {catalog.map((product) => (
                  <Pressable
                    key={product.id}
                    onPress={() => router.push(`/gifts/${product.id}` as never)}
                    className="w-[47%] overflow-hidden rounded-2xl border border-slate-100 bg-white active:opacity-80 dark:border-slate-800 dark:bg-slate-900"
                  >
                    {product.catalog_preview_asset_url || product.preview_asset_url ? (
                      <Image
                        source={{ uri: product.catalog_preview_asset_url || product.preview_asset_url }}
                        className="h-28 w-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="h-28 items-center justify-center bg-rose-50 dark:bg-rose-950">
                        <Text className="text-4xl">
                          {product.category === "CARD" ? "🎴" : product.category === "FLOWER" ? "🌸" : product.category === "MESSAGE" ? "💌" : product.category === "BADGE" ? "🏅" : "🎬"}
                        </Text>
                      </View>
                    )}
                    <View className="p-3">
                      <Text className="text-sm font-semibold text-slate-800 dark:text-white" numberOfLines={1}>{product.name}</Text>
                      <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(product.price, product.currency)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              {/* Received gifts */}
              {publicGifts.length > 0 && (
                <>
                  <Text className="mt-2 font-semibold text-slate-800 dark:text-white">Gifts received</Text>
                  <View className="gap-3">
                    {publicGifts.map((gift) => (
                      <Card key={gift.id}>
                        <View className="flex-row items-center gap-3">
                          <View className="h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950">
                            <Gift size={18} color="#e11d48" />
                          </View>
                          <View className="flex-1">
                            <Text className="font-semibold text-slate-800 dark:text-white">{gift.product?.name}</Text>
                            {!gift.is_anonymous && gift.from_name ? (
                              <Text className="text-xs text-slate-400">From {gift.from_name}</Text>
                            ) : null}
                            {gift.custom_message ? (
                              <Text className="mt-0.5 text-sm italic text-slate-500" numberOfLines={2}>
                                &quot;{gift.custom_message}&quot;
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      </Card>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
