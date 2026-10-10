import { ALL_CURRENCIES, CurrencyPicker } from "../../components/CurrencyPicker";
import { useSupabase } from "@/hooks/useSupabase";
import {
  onboardingSchema,
  OnboardingFormValues,
} from "@/lib/schemas/onboarding";
import { useUserStore } from "@/store/userStore";
import { useUser } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const { user } = useUser();
  const authSupabase = useSupabase();
  const setCurrency = useUserStore((s) => s.setCurrency);
  const setNeedsOnboarding = useUserStore((s) => s.setNeedsOnboarding);

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onBlur",
    defaultValues: { startingBalance: "" },
  });

  const [selectedCurrency, setSelectedCurrency] = useState(
    ALL_CURRENCIES.find((c) => c.code === "INR") ?? ALL_CURRENCIES[0]
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async ({ startingBalance }: OnboardingFormValues) => {
    const parsed = parseFloat(startingBalance.replace(/,/g, ""));

    setSaving(true);
    setError("");

    const { error: updateError } = await authSupabase
      .from("users")
      .update({ currency: selectedCurrency.code })
      .eq("clerk_id", user!.id);

    if (updateError) {
      setSaving(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    const {
      data: defaultAccount,
      error: accountFetchError,
    } = await authSupabase
      .from("accounts")
      .select("id, balance")
      .eq("user_id", user!.id)
      .eq("is_default", true)
      .single();

    if (accountFetchError || !defaultAccount) {
      setSaving(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    const { error: txError } = await authSupabase
      .from("transactions")
      .insert({
        user_id: user!.id,
        account_id: defaultAccount.id,
        type: "INCOME",
        amount: parsed,
        category: "other_income",
        description: "Starting balance",
        date: new Date().toISOString(),
        input_method: "MANUAL",
      });

    if (txError) {
      setSaving(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    const { error: balanceError } = await authSupabase
      .from("accounts")
      .update({ balance: defaultAccount.balance + parsed })
      .eq("id", defaultAccount.id);

    setSaving(false);

    if (balanceError) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setCurrency(selectedCurrency.code);
    setNeedsOnboarding(false);
    router.replace("/(root)/(tabs)");
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F8F7F2",
      }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            justifyContent: "center",
            marginTop: -64,
          }}
        >
          <Image
            source={require("../../assets/images/budgetco.png")}
            style={{
              width: 128,
              height: 56,
              marginBottom: 40,
            }}
            resizeMode="contain"
          />

          <Text
            style={{
              color: "#1A1D26",
              fontSize: 30,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            Let's get you set up
          </Text>

          <Text
            style={{
              color: "#8A8D96",
              fontSize: 14,
              marginBottom: 40,
            }}
          >
            A couple of quick details to personalise your experience.
          </Text>

          {/* Starting balance */}
          <Text
            style={{
              color: "#1A1D26",
              fontSize: 12,
              fontWeight: "500",
              marginBottom: 6,
            }}
          >
            Starting balance
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E8E6DF",
              borderRadius: 12,
              paddingHorizontal: 16,
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                color: "#6B6E77",
                fontSize: 14,
                marginRight: 8,
              }}
            >
              {selectedCurrency.symbol}
            </Text>

            <Controller
              control={control}
              name="startingBalance"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={(v) => {
                    setError("");
                    onChange(v);
                  }}
                  placeholder="e.g. 50000"
                  placeholderTextColor="#8A8D96"
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    fontSize: 14,
                    color: "#1A1D26",
                  }}
                />
              )}
            />
          </View>

          {formErrors.startingBalance && (
            <Text
              style={{
                color: "#F16B65",
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              {formErrors.startingBalance.message}
            </Text>
          )}

          <View style={{ marginBottom: 16 }} />

          {/* Currency picker */}
          <Text
            style={{
              color: "#1A1D26",
              fontSize: 12,
              fontWeight: "500",
              marginBottom: 6,
            }}
          >
            Currency
          </Text>

          <TouchableOpacity
            onPress={() => setPickerOpen(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E8E6DF",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: "#1A1D26",
              }}
            >
              {selectedCurrency.symbol} {selectedCurrency.code} —{" "}
              {selectedCurrency.name}
            </Text>

            <Feather
              name="chevron-down"
              size={16}
              color="#8A8D96"
            />
          </TouchableOpacity>

          {error ? (
            <Text
              style={{
                color: "#F16B65",
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              {error}
            </Text>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit(handleSave)}
            disabled={saving}
            style={{
              backgroundColor: "#1A1D26",
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
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
              {saving ? "Saving…" : "Get started"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CurrencyPicker
        visible={pickerOpen}
        selectedCode={selectedCurrency.code}
        onSelect={(currency) => {
          setSelectedCurrency(currency);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}