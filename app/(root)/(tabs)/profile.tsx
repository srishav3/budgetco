
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
    <Text
      style={{
        color: "#5C5F68",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: 24,
        marginHorizontal: 20,
      }}
    >
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
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F0EEE7",
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: "#F5F4F0",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Feather name={icon} size={15} color={danger ? "#FF6B4A" : "#5C5F68"} />
      </View>

      <Text
        style={{
          flex: 1,
          fontSize: 14,
          color: danger ? "#FF6B4A" : "#0B0E14",
        }}
      >
        {label}
      </Text>

      {value && (
        <Text
          style={{
            color: "#8A8D96",
            fontSize: 12,
            marginRight: 8,
          }}
        >
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F4F0" }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ color: "#0B0E14", fontSize: 20, fontWeight: "600" }}>
            Profile
          </Text>
        </View>

        {/* User card */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            backgroundColor: "#0B0E14",
            borderRadius: 16,
            paddingHorizontal: 20,
            paddingVertical: 24,
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={handlePickAvatar}
            disabled={uploadingAvatar}
            activeOpacity={0.8}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#1A1D26",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              borderWidth: 2,
              borderColor: "#2A2E3A",
            }}
          >
            {uploadingAvatar ? (
              <ActivityIndicator color="#8A8D96" />
            ) : user?.imageUrl && user.hasImage ? (
              <Image
                source={{ uri: user.imageUrl }}
                style={{ width: 80, height: 80 }}
                contentFit="cover"
              />
            ) : (
              <Feather name="user" size={30} color="#8A8D96" />
            )}

            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 24,
                backgroundColor: "rgba(0,0,0,0.5)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="camera" size={13} color="#F2EFE9" />
            </View>
          </TouchableOpacity>

          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 24,
              fontWeight: "700",
              marginTop: 14,
            }}
          >
            {user?.firstName} {user?.lastName}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 4,
            }}
          >
            <Feather name="mail" size={11} color="#8A8D96" />
            <Text
              style={{ color: "#8A8D96", fontSize: 12 }}
              numberOfLines={1}
            >
              {user?.emailAddresses?.[0]?.emailAddress}
            </Text>
          </View>
        </View>

        {/* Accounts */}
        <SectionLabel>Accounts</SectionLabel>
        <View
          style={{
            marginHorizontal: 20,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#E8E6DF",
          }}
        >
          {loadingAccounts ? (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                paddingHorizontal: 16,
                paddingVertical: 20,
                alignItems: "center",
              }}
            >
              <ActivityIndicator color="#5C5F68" />
            </View>
          ) : accountsError ? (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                paddingHorizontal: 16,
                paddingVertical: 20,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#5C5F68", fontSize: 12 }}>
                Couldn&apos;t load your accounts.
              </Text>
            </View>
          ) : (
            accounts.map((account) => (
              <Row
                key={account.id}
                icon={ACCOUNT_ICON[account.type]}
                label={account.name + (account.is_default ? " (default)" : "")}
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
            label="Add account"
            onPress={() => {
              setEditingAccount(null);
              setModalVisible(true);
            }}
          />
        </View>

        {/* Preferences */}
        <SectionLabel>Preferences</SectionLabel>
        <View
          style={{
            marginHorizontal: 20,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#E8E6DF",
          }}
        >
          <Row
            icon="dollar-sign"
            label="Currency"
            value={currency}
            onPress={() => setCurrencyPickerOpen(true)}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#F5F4F0",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Feather name="lock" size={15} color="#5C5F68" />
            </View>

            <Text style={{ flex: 1, fontSize: 14, color: "#0B0E14" }}>
              Biometric lock
            </Text>

            <Switch value={biometricLock} onValueChange={setBiometricLock} />
          </View>
        </View>

        {/* Account actions */}
        <SectionLabel>Account</SectionLabel>
        <View
          style={{
            marginHorizontal: 20,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#E8E6DF",
          }}
        >
          <Row
            icon="log-out"
            label="Sign out"
            onPress={handleSignOut}
            showChevron={false}
            danger
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
