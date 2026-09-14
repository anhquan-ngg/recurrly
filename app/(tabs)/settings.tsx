import images from "@/constants/images";
import { posthog } from "@/lib/posthog";
import { formatJoinedDate, getDisplayName } from "@/lib/utils";
import { useAuth, useUser } from "@clerk/expo";
import { styled } from "nativewind";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { signOut } = useAuth();
  const { user } = useUser();

  const displayName = getDisplayName(user);
  const email = user?.primaryEmailAddress?.emailAddress ?? "—";

  const handleSignOut = async () => {
    await signOut();
    posthog?.capture("sign_out_completed");
    posthog?.reset();
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="settings-title">Settings</Text>

      <View className="settings-card">
        <View className="settings-profile-row">
          <Image source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar} className="settings-avatar" />
          <View className="settings-profile-copy">
            <Text className="settings-name" numberOfLines={1}>
              {displayName}
            </Text>
            <Text className="settings-email" numberOfLines={1} ellipsizeMode="tail">
              {email}
            </Text>
          </View>
        </View>
      </View>

      <View className="settings-card">
        <Text className="settings-section-title">Account</Text>

        <View className="settings-row">
          <Text className="settings-row-label">Account ID</Text>
          <Text className="settings-row-value" numberOfLines={1} ellipsizeMode="tail">
            {user?.id ?? "—"}
          </Text>
        </View>

        <View className="settings-row">
          <Text className="settings-row-label">Joined</Text>
          <Text className="settings-row-value">{formatJoinedDate(user?.createdAt)}</Text>
        </View>
      </View>

      <Pressable className="auth-button" onPress={handleSignOut}>
        <Text className="auth-button-text">Sign Out</Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default Settings;
