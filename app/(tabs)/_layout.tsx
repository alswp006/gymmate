import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#09090b",
          borderTopColor: "#1e1e22",
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#63636e",
        headerStyle: { backgroundColor: "#09090b" },
        headerTintColor: "#f0f0f3",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarLabel: "Home" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarLabel: "Profile" }} />
    </Tabs>
  );
}
