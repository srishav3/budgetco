import { useUpsertBudget } from "../hooks/mutations/useBudgetMutations";
import { Budget } from "@/lib/services/budgets";
import { COLORS } from "@/constants/theme";
import { FormSheetModal } from "./FormSheetModal";
import { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity } from "react-native";

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
      setError("Enter a valid monthly budget.");
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
      title={budget ? "Edit monthly budget" : "Set monthly budget"}
      onClose={onClose}
    >
      <Text className="text-[#1A1D26] text-xs font-medium mb-1.5">
        Monthly budget
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
        className="bg-white border border-[#E8E6DF] rounded-xl px-4 py-3.5 mb-5 text-sm text-[#1A1D26]"
      />

      {error ? (
        <Text className="text-[#FF6B4A] text-xs mb-3">
          {error}
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        className={`bg-[#1A1D26] rounded-xl py-4 items-center mb-3 ${
          saving ? "opacity-70" : "opacity-100"
        }`}
        activeOpacity={0.85}
      >
        <Text className="text-white text-sm font-semibold">
          {saving ? "Saving…" : "Save budget"}
        </Text>
      </TouchableOpacity>
    </FormSheetModal>
  );
}