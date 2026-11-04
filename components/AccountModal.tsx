
import {
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/hooks/mutations/useAccountMutations";
import { Account, AccountType } from "@/lib/services/accounts";
import { COLORS } from "@/constants/theme";
import { FormSheetModal } from "@/components/FormSheetModal";
import { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

const ACCOUNT_TYPES: AccountType[] = ["CASH", "BANK", "CREDIT_CARD", "SAVINGS"];

const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  CASH: "Cash",
  BANK: "Bank",
  CREDIT_CARD: "Credit card",
  SAVINGS: "Savings",
};

export function AccountModal({
  visible,
  account,
  onClose,
  onSaved,
  onDeleted,
  onMadeDefault,
}: {
  visible: boolean;
  account: Account | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
  onMadeDefault: () => void;
}) {
  const isEditing = !!account;
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("CASH");
  const [error, setError] = useState("");

  const { mutateAsync: createAccount, isPending: creating } = useCreateAccount();
  const { mutateAsync: updateAccount, isPending: updating } = useUpdateAccount();
  const { mutateAsync: deleteAccount } = useDeleteAccount();

  const saving = creating || updating;

  useEffect(() => {
    if (visible) {
      setName(account?.name ?? "");
      setType(account?.type ?? "CASH");
      setError("");
    }
  }, [visible, account]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter an account name.");
      return;
    }
    setError("");
    try {
      if (isEditing) {
        await updateAccount({ accountId: account.id, payload: { name: name.trim(), type } });
      } else {
        await createAccount({ name: name.trim(), type });
      }
      onSaved();
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!account) return;
    try {
      const result = await deleteAccount({ accountId: account.id });
      if (result.deleted) {
        onDeleted();
        return;
      }

      Alert.alert(
        "Delete account",
        `This will also delete ${result.transactionCount} transaction${
          result.transactionCount === 1 ? "" : "s"
        }. This can't be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteAccount({ accountId: account.id, force: true });
                onDeleted();
              } catch {
                Alert.alert("Error", "Couldn't delete the account.");
              }
            },
          },
        ]
      );
    } catch {
      Alert.alert("Error", "Couldn't check the account's transactions.");
    }
  };

  return (
    <FormSheetModal
      visible={visible}
      title={isEditing ? "Edit account" : "Add account"}
      onClose={onClose}
    >
      <Text
        style={{
          color: "#0B0E14",
          fontSize: 12,
          fontWeight: "500",
          marginBottom: 6,
        }}
      >
        Name
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. HDFC Savings"
        placeholderTextColor={COLORS.placeholder}
        style={{
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#E8E6DF",
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 14,
          color: "#0B0E14",
          marginBottom: 20,
        }}
      />

      <Text
        style={{
          color: "#0B0E14",
          fontSize: 12,
          fontWeight: "500",
          marginBottom: 6,
        }}
      >
        Type
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {ACCOUNT_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setType(t)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              backgroundColor: type === t ? "#0B0E14" : "#FFFFFF",
              borderColor: type === t ? "#0B0E14" : "#E8E6DF",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: type === t ? "#FFFFFF" : "#0B0E14",
              }}
            >
              {ACCOUNT_TYPE_LABEL[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <Text
          style={{
            color: "#FF6B4A",
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          {error}
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        style={{
          backgroundColor: "#0B0E14",
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: "center",
          marginBottom: 12,
        }}
        activeOpacity={0.85}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: "600",
          }}
        >
          {saving ? "Saving…" : isEditing ? "Save changes" : "Add account"}
        </Text>
      </TouchableOpacity>

      {isEditing && !account.is_default && (
        <TouchableOpacity
          onPress={onMadeDefault}
          style={{
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#1A85FF",
              fontSize: 14,
              fontWeight: "500",
            }}
          >
            Make default
          </Text>
        </TouchableOpacity>
      )}

      {isEditing && (
        <TouchableOpacity
          onPress={handleDelete}
          style={{
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#FF6B4A",
              fontSize: 14,
              fontWeight: "500",
            }}
          >
            Delete account
          </Text>
        </TouchableOpacity>
      )}
    </FormSheetModal>
  );
}
