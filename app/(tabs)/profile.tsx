import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-xl font-semibold text-text mb-2">Profile</Text>
        <Text className="text-sm text-text-secondary">Sign in to access your account</Text>
      </View>
    </SafeAreaView>
  );
}
