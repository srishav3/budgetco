import { AccountModal } from "@/components/AccountModal";
import { CurrencyPicker } from "@/components/CurrencyPicker";
import { useSetDefaultAccount } from "@/hooks/mutations/useAccountMutations";
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery";
import { useSupabase } from "@/hooks/useSupabase";
import { Account, AccountType } from "@/lib/services/accounts";
import { formatPrice } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { useAuth, useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCOUNT_ICON: Record<AccountType, keyof typeof Feather.glyphMap> = {
  CASH: "dollar-sign",
  BANK: "home",
  CREDIT_CARD: "credit-card",
  SAVINGS: "shield",
};

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="text-[#6B6E77] text-xs font-semibold uppercase tracking-wider mb-2 mt-6 mx-5">
      {children}
    </Text>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  danger = false,
  isLast = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className={`flex-row items-center bg-white px-4.5 py-4 ${
        isLast ? "" : "border-b border-[#F0EEE7]"
      }`}
    >
      <View
        className={`w-9 h-9 rounded-xl items-center justify-center mr-3.5 ${
          danger ? "bg-[#FF6B4A]/10" : "bg-[#F8F7F2] border border-[#E8E6DF]"
        }`}
      >
        <Feather name={icon} size={16} color={danger ? "#FF6B4A" : "#1A1D26"} />
      </View>

      <Text
        className={`flex-1 text-sm font-semibold ${
          danger ? "text-[#FF6B4A]" : "text-[#1A1D26]"
        }`}
      >
        {label}
      </Text>

      {value && (
        <Text className="text-[#6B6E77] text-xs font-medium mr-2">
          {value}
        </Text>
      )}

      {showChevron && onPress && (
        <Feather name="chevron-right" size={16} color="#BDC3C7" />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const supabase = useSupabase();
  const currency = useUserStore((state) => state.currency);
  const setCurrency = useUserStore((state) => state.setCurrency);
  const [biometricLock, setBiometricLock] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const {
    data: accounts = [],
    isLoading: loadingAccounts,
    isError: accountsError,
  } = useAccountsQuery();
  const { mutateAsync: setDefaultAccount } = useSetDefaultAccount();

  const handlePickAvatar = async () => {
    if (!user) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to set a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const filename = asset.uri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : "image/jpeg";
      const dataUrl = `data:${mimeType};base64,${asset.base64}`;

      await user.setProfileImage({ file: dataUrl });
    } catch (err) {
      console.error("Avatar upload failed:", err);
      Alert.alert("Error", "Couldn't upload your photo. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/sign-in");
        },
      },
    ]);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingAccount(null);
  };

  const handleMadeDefault = async () => {
    if (!editingAccount) return;
    try {
      await setDefaultAccount(editingAccount.id);
      closeModal();
    } catch {
      Alert.alert("Error", "Couldn't set this as the default account.");
    }
  };

  const handleCurrencySelect = async (selected: { code: string }) => {
    setCurrencyPickerOpen(false);
    if (!user) return;
    try {
      const { error } = await supabase
        .from("users")
        .update({ currency: selected.code })
        .eq("clerk_id", user.id);
      if (error) throw error;
      setCurrency(selected.code);
    } catch {
      Alert.alert("Error", "Couldn't update your currency.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7F2]" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <View className="px-5 pt-3 pb-3">
          <Text className="text-[#1A1D26] text-2xl font-bold tracking-tight">
            Profile
          </Text>
          <Text className="text-[#6B6E77] text-xs mt-0.5 font-medium">
            Manage your account and preferences
          </Text>
        </View>

        {/* User hero card */}
        <View className="mx-5 mt-1 bg-[#1A1D26] rounded-3xl px-6 py-6 items-center shadow-md shadow-black/15">
          <TouchableOpacity
            onPress={handlePickAvatar}
            disabled={uploadingAvatar}
            activeOpacity={0.8}
            className="w-20 h-20 rounded-full bg-[#2A2E3A] items-center justify-center overflow-hidden border-2 border-white/20 shadow-sm"
          >
            {uploadingAvatar ? (
              <ActivityIndicator color="#8A8D96" />
            ) : user?.imageUrl && user.hasImage ? (
              <Image
                source={{ uri: user.imageUrl }}
                className="w-20 h-20"
                contentFit="cover"
              />
            ) : (
              <Feather name="user" size={32} color="#8A8D96" />
            )}

            <View className="absolute bottom-0 inset-x-0 h-6 bg-black/60 items-center justify-center">
              <Feather name="camera" size={13} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text className="text-white text-xl font-bold mt-3.5 tracking-tight">
            {user?.firstName} {user?.lastName}
          </Text>

          <View className="flex-row items-center gap-1.5 mt-1 bg-white/10 px-3 py-1 rounded-full">
            <Feather name="mail" size={11} color="#A0A5B5" />
            <Text
              className="text-[#D0D4E0] text-xs font-medium"
              numberOfLines={1}
            >
              {user?.emailAddresses?.[0]?.emailAddress}
            </Text>
          </View>
        </View>

        {/* Accounts Section */}
        <SectionLabel>Linked Accounts</SectionLabel>
        <View className="mx-5 rounded-2xl overflow-hidden border border-[#E8E6DF] bg-white shadow-sm shadow-black/5">
          {loadingAccounts ? (
            <View className="px-4 py-5 items-center">
              <ActivityIndicator color="#4A9EFF" />
            </View>
          ) : accountsError ? (
            <View className="px-4 py-5 items-center">
              <Text className="text-[#FF6B4A] text-xs font-medium">
                Couldn&apos;t load your accounts.
              </Text>
            </View>
          ) : (
            accounts.map((account) => (
              <Row
                key={account.id}
                icon={ACCOUNT_ICON[account.type]}
                label={account.name + (account.is_default ? " (Default)" : "")}
                value={formatPrice(account.balance, currency)}
                onPress={() => {
                  setEditingAccount(account);
                  setModalVisible(true);
                }}
              />
            ))
          )}

          <Row
            icon="plus"
            label="Add new account"
            onPress={() => {
              setEditingAccount(null);
              setModalVisible(true);
            }}
            isLast
          />
        </View>

        {/* Preferences */}
        <SectionLabel>Preferences</SectionLabel>
        <View className="mx-5 rounded-2xl overflow-hidden border border-[#E8E6DF] bg-white shadow-sm shadow-black/5">
          <Row
            icon="dollar-sign"
            label="Default Currency"
            value={currency}
            onPress={() => setCurrencyPickerOpen(true)}
          />

          <View className="flex-row items-center bg-white px-4.5 py-4">
            <View className="w-9 h-9 rounded-xl bg-[#F8F7F2] border border-[#E8E6DF] items-center justify-center mr-3.5">
              <Feather name="lock" size={16} color="#1A1D26" />
            </View>

            <Text className="flex-1 text-sm font-semibold text-[#1A1D26]">
              Biometric Lock
            </Text>

            <Switch
              value={biometricLock}
              onValueChange={setBiometricLock}
              trackColor={{ false: "#E8E6DF", true: "#1A1D26" }}
              thumbColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
            />
          </View>
        </View>

        {/* Account actions */}
        <SectionLabel>Security & Session</SectionLabel>
        <View className="mx-5 rounded-2xl overflow-hidden border border-[#E8E6DF] bg-white shadow-sm shadow-black/5">
          <Row
            icon="log-out"
            label="Sign Out"
            onPress={handleSignOut}
            showChevron={false}
            danger
            isLast
          />
        </View>
      </ScrollView>

      {user && (
        <AccountModal
          visible={modalVisible}
          account={editingAccount}
          onClose={closeModal}
          onSaved={closeModal}
          onDeleted={closeModal}
          onMadeDefault={handleMadeDefault}
        />
      )}

      <CurrencyPicker
        visible={currencyPickerOpen}
        selectedCode={currency}
        onSelect={handleCurrencySelect}
        onClose={() => setCurrencyPickerOpen(false)}
      />
    </SafeAreaView>
  );
}
