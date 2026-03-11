import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const PREFIX = "gymmate_";

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(PREFIX + key);
  }
  return SecureStore.getItemAsync(PREFIX + key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(PREFIX + key, value);
    return;
  }
  await SecureStore.setItemAsync(PREFIX + key, value);
}

export async function removeItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(PREFIX + key);
    return;
  }
  await SecureStore.deleteItemAsync(PREFIX + key);
}
