import { useUpsertBudget } from "../hooks/mutations/useBudgetMutations";
import { Budget } from "@/lib/services/budgets";
import { COLORS } from "@/constants/theme";
import { FormSheetModal } from "./FormSheetModal";
import { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export function BudgetModal({
  visible,
  budget,
  onClose,
  onSaved,
}: {
  visible: boolean;
  budget: Budget | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const {
    mutateAsync: upsertBudget,
    isPending: saving,
  } = useUpsertBudget();

  useEffect(() => {
    if (visible) {
      setAmount(budget ? String(budget.amount) : "");
      setError("");
    }
  }, [visible, budget]);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount.replace(/,/g, ""));

    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter a valid monthly budget amount.");
      return;
    }

    setError("");

    try {
      await upsertBudget(parsedAmount);
      onSaved();
    } catch (err) {
      console.error("Error saving budget:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <FormSheetModal
      visible={visible}
      title={budget ? "Edit Monthly Budget" : "Set Monthly Budget"}
      onClose={onClose}
    >
      <Text className="text-[#6B6E77] text-xs font-semibold uppercase tracking-wider mb-2">
        Budget Target
      </Text>

      <TextInput
        value={amount}
        onChangeText={(v) => {
          setError("");
          setAmount(v);
        }}
        placeholder="e.g. 50000"
        placeholderTextColor={COLORS.placeholder}
        keyboardType="numeric"
        autoFocus
        className="bg-white border border-[#E8E6DF] rounded-2xl px-4 py-3.5 mb-4 text-base font-semibold text-[#1A1D26] shadow-sm shadow-black/5"
      />

      {error ? (
        <View className="bg-[#FF6B4A]/10 border border-[#FF6B4A]/30 rounded-xl px-4 py-2.5 mb-4">
          <Text className="text-[#FF6B4A] text-xs font-medium">
            {error}
          </Text>
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
          {saving ? "Saving…" : "Save Budget"}
        </Text>
      </TouchableOpacity>
    </FormSheetModal>
  );
}
