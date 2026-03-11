import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingVertical: 24 }}>
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-text mb-2">짐메이트</Text>
          <Text className="text-base text-text-secondary text-center max-w-[300px]">
            친구들과 함께 성장하는 웨이트 트레이닝 기록 앱
          </Text>
        </View>

        <View className="gap-3 mb-8">
          <Button label="시작하기" onPress={() => {}} />
          <Button label="더 알아보기" variant="secondary" onPress={() => {}} />
        </View>

        <View className="gap-3">
          <Card title="Quick Start" description="Get up and running in just a few taps" icon="zap" />
          <Card title="AI Powered" description="Built with the latest AI technology" icon="sparkles" />
          <Card title="Secure" description="All your data is safely stored" icon="shield" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
