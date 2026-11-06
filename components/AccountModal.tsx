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
  CREDIT_CARD: "Credit Card",
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
      title={isEditing ? "Edit Account" : "Add Account"}
      onClose={onClose}
    >
      <Text className="text-[#6B6E77] text-xs font-semibold uppercase tracking-wider mb-2">
        Account Name
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. HDFC Savings, Cash Wallet"
        placeholderTextColor={COLORS.placeholder}
        className="bg-white border border-[#E8E6DF] rounded-2xl px-4 py-3.5 text-sm text-[#1A1D26] mb-4 shadow-sm shadow-black/5"
      />

      <Text className="text-[#6B6E77] text-xs font-semibold uppercase tracking-wider mb-2">
        Account Type
      </Text>

      <View className="flex-row flex-wrap gap-2 mb-5">
        {ACCOUNT_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setType(t)}
            className={`px-4 py-2.5 rounded-xl border ${
              type === t
                ? "bg-[#1A1D26] border-[#1A1D26] shadow-sm shadow-black/10"
                : "bg-white border-[#E8E6DF]"
            }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-xs font-semibold ${
                type === t ? "text-white" : "text-[#6B6E77]"
              }`}
            >
              {ACCOUNT_TYPE_LABEL[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View className="bg-[#FF6B4A]/10 border border-[#FF6B4A]/30 rounded-xl px-4 py-2.5 mb-4">
          <Text className="text-[#FF6B4A] text-xs font-medium">{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        className="bg-[#1A1D26] rounded-2xl py-4 items-center mb-3 shadow-sm shadow-black/10"
        style={{ opacity: saving ? 0.7 : 1 }}
        activeOpacity={0.85}
      >
        <Text className="text-white text-sm font-semibold tracking-wide">
          {saving ? "Saving…" : isEditing ? "Save Changes" : "Create Account"}
        </Text>
      </TouchableOpacity>

      {isEditing && !account.is_default && (
        <TouchableOpacity
          onPress={onMadeDefault}
          className="py-2.5 items-center"
        >
          <Text className="text-[#4A9EFF] text-sm font-semibold">
            Set as Default Account
          </Text>
        </TouchableOpacity>
      )}

      {isEditing && (
        <TouchableOpacity
          onPress={handleDelete}
          className="py-2.5 items-center"
        >
          <Text className="text-[#FF6B4A] text-sm font-semibold">
            Delete Account
          </Text>
        </TouchableOpacity>
      )}
    </FormSheetModal>
  );
}
