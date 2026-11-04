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
      <Text
        style={{
          color: "#1A1D26",
          fontSize: 12,
          fontWeight: "500",
          marginBottom: 6,
        }}
      >
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
        style={{
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#E8E6DF",
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          marginBottom: 20,
          fontSize: 14,
          color: "#1A1D26",
        }}
      />

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
          backgroundColor: "#1A1D26",
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: "center",
          marginBottom: 12,
          opacity: saving ? 0.7 : 1,
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
          {saving ? "Saving…" : "Save budget"}
        </Text>
      </TouchableOpacity>
    </FormSheetModal>
  );
}