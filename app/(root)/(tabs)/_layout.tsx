import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

const useNativeTabs = Platform.OS === "ios";

export default function TabLayout() {
  if (useNativeTabs) {
    return (
      <NativeTabs
        backgroundColor="#1A1D26"
        tintColor="#4A9EFF"
        iconColor={{ default: "#8A8D96", selected: "#4A9EFF" }}
        labelStyle={{
          default: { color: "#8A8D96" },
          selected: { color: "#4A9EFF" },
        }}
      >
        <NativeTabs.Trigger name="index">
          <Label>Home</Label>
          <Icon sf="house.fill" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="transactions">
          <Icon sf="list.bullet" />
          <Label>Transactions</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="add-transaction">
          <Icon sf="plus.circle.fill" />
          <Label>Add</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="assistant">
          <Icon sf="brain.head.profile" />
          <Label>Assistant</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile">
          <Icon sf="person.fill" />
          <Label>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  // Android / Expo Go fallback — standard JS-based tab bar
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1A1D26",
        tabBarInactiveTintColor: "#8A8D96",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E8E6DF",
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === "android" ? 10 : 8,
          height: Platform.OS === "android" ? 68 : 64,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Feather name="home" size={focused ? 22 : 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color, focused }) => (
            <Feather name="list" size={focused ? 22 : 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-transaction"
        options={{
          title: "Add",
          tabBarIcon: ({ color, focused }) => (
            <Feather name="plus-circle" size={focused ? 24 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant",
          tabBarIcon: ({ color, focused }) => (
            <Feather name="cpu" size={focused ? 22 : 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Feather name="user" size={focused ? 22 : 20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
