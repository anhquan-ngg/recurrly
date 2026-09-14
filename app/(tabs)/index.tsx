import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import { HOME_BALANCE, HOME_SUBSCRIPTIONS, UPCOMING_SUBSCRIPTIONS } from "@/constants/data";
import { icons } from "@/constants/icons";
import images from "@/constants/images";
import "@/global.css";
import { formatCurrency, getDisplayName } from "@/lib/utils";
import { posthog } from "@/lib/posthog";
import { useUser } from "@clerk/expo";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useState } from "react";
import { FlatList, Image, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Home = () => {
  const { user } = useUser();
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
  const displayName = getDisplayName(user);

  const handleSubscriptionDetailsToggle = (subscriptionId: string, isExpanded: boolean) => {
    posthog?.capture("subscription_details_toggled", {
      subscription_id: subscriptionId,
      is_expanded: !isExpanded,
    });
    setExpandedSubscriptionId(isExpanded ? null : subscriptionId);
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        ListHeaderComponent={() => (
          <>
            <View className="home-header">
              <View className="home-user">
                <Image source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar} className="w-16 h-16 rounded-full" />
                <Text className="home-user-name">{displayName}</Text>
              </View>
              <Image source={icons.add} className="home-add-icon" />
            </View>

            <View className="home-balance-card">
              <Text className="home-balance-label">Balance</Text>

              <View className="home-balance-row">
                <Text className="home-balance-amount">{formatCurrency(HOME_BALANCE.amount)}</Text>
                <Text className="home-balance-date">{dayjs(HOME_BALANCE.nextRenewalDate).format("MM/DD")}</Text>
              </View>
            </View>

            <View className="mb-5">
              <ListHeading title="Upcoming" />

              <FlatList
                data={UPCOMING_SUBSCRIPTIONS}
                renderItem={({ item }) => <UpcomingSubscriptionCard {...item} />}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={() => <Text className="home-empty-state">No upcoming subscriptions.</Text>}
              />
            </View>

            <ListHeading title="All Subscriptions" />
          </>
        )}
        data={HOME_SUBSCRIPTIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() => handleSubscriptionDetailsToggle(item.id, expandedSubscriptionId === item.id)}
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => <Text className="home-empty-state">No subscriptions yet.</Text>}
        contentContainerClassName="pb-30"
      />
    </SafeAreaView>
  );
};

export default Home;
