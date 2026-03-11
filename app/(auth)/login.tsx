import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // TODO: Implement login API call
      router.replace("/(tabs)");
    } catch (e) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-2xl font-bold text-text text-center mb-2">Welcome Back</Text>
          <Text className="text-sm text-text-secondary text-center mb-8">Sign in to your account</Text>

          {error ? (
            <View className="bg-danger-soft rounded-lg p-3 mb-4">
              <Text className="text-danger text-sm text-center">{error}</Text>
            </View>
          ) : null}

          <View className="gap-4 mb-6">
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              accessibilityLabel="Email address"
            />
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              accessibilityLabel="Password"
            />
          </View>

          <Button label="Sign In" onPress={handleLogin} loading={loading} />

          <Text
            className="text-sm text-accent text-center mt-6"
            onPress={() => router.push("/(auth)/signup")}
            accessibilityRole="link"
          >
            Don&apos;t have an account? Sign Up
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
