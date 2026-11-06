import { AIActionCard } from "@/components/AIActionCard";
import { CalendarPicker } from "@/components/CalendarPicker";
import { AI_GRADIENT, AI_GRADIENT_REVERSE } from "@/constants/theme";
import { PillGroup } from "@/components/PillGroup";
import { ReceiptScannerModal } from "@/components/ReceiptScannerModal";
import { VoiceRecorderModal } from "@/components/VoiceRecorderModal";
import {
  CategoryKey,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/constants/categories";
import { useCreateTransaction } from "@/hooks/mutations/useTransactionMutations";
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery";
import {
  TransactionFormValues,
  transactionSchema,
} from "@/lib/schemas/transaction";
import { Account } from "@/lib/services/accounts";
import {
  ExtractedTransaction,
  extractTransactionFromReceipt,
} from "@/lib/services/extractTransaction";
import { InputMethod } from "@/lib/services/transactions";
import { useUserStore } from "@/store/userStore";
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TYPE_OPTIONS = [
  { key: "EXPENSE" as const, label: "Expense" },
  { key: "INCOME" as const, label: "Income" },
];

const DEFAULT_VALUES = (accounts: Account[]): TransactionFormValues => ({
  type: "EXPENSE",
  amount: "",
  category: "food",
  accountId: accounts[0]?.id ?? "",
  description: "",
  date: new Date(),
});

export default function AddTransactionScreen() {
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams<{ action?: string }>();
  const currency = useUserStore((state) => state.currency);

  const {
    data: accounts = [],
    isLoading: loadingAccounts,
    isError: accountsError,
  } = useAccountsQuery();
  const { mutateAsync: createTransaction, isPending: saving } =
    useCreateTransaction();

  const [error, setError] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [inputMethod, setInputMethod] = useState<InputMethod>("MANUAL");
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset: resetForm,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    mode: "onBlur",
    defaultValues: DEFAULT_VALUES([]),
  });

  const type = watch("type");
  const category = watch("category");
  const accountId = watch("accountId");
  const date = watch("date");

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (accounts.length > 0) resetForm(DEFAULT_VALUES(accounts));
  }, [accounts, resetForm]);

  const applyExtraction = (result: ExtractedTransaction) => {
    const categoryList =
      result.type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const isValidCategory = (key: CategoryKey | null): key is CategoryKey =>
      !!key && categoryList.some((c) => c.key === key);

    if (result.type) setValue("type", result.type);
    if (isValidCategory(result.category)) setValue("category", result.category);
    if (result.amount != null) setValue("amount", String(result.amount));
    if (result.description) setValue("description", result.description);
    if (result.date) {
      const parsedDate = new Date(result.date);
      if (isValid(parsedDate) && parsedDate <= new Date()) {
        setValue("date", parsedDate);
      }
    }

    const missing = [
      result.amount == null && "amount",
      !isValidCategory(result.category) && "category",
    ].filter(Boolean);
    if (missing.length > 0) {
      Alert.alert(
        "Review before saving",
        `Couldn't confidently read the ${missing.join(" and ")}. Please fill it in.`
      );
    }
  };

  const handleReceiptCaptured = async (base64: string, mimeType: string) => {
    setScannerOpen(false);
    setScanning(true);
    try {
      const extracted = await extractTransactionFromReceipt(base64, mimeType);
      applyExtraction(extracted);
      setInputMethod("RECEIPT_SCAN");
    } catch (err) {
      console.error("Receipt scan failed:", err);
      Alert.alert("Error", "Couldn't read that receipt. Try again or enter it manually.");
    } finally {
      setScanning(false);
    }
  };

  const handleVoiceExtracted = (result: ExtractedTransaction) => {
    applyExtraction(result);
    setVoiceTranscript(result.transcript);
    setInputMethod("VOICE");
  };

  useEffect(() => {
    if (params.action === "scan") {
      setScannerOpen(true);
      router.setParams({ action: undefined });
    } else if (params.action === "voice") {
      setVoiceModalOpen(true);
      router.setParams({ action: undefined });
    }
  }, [params.action, router]);

  const onSubmit = async (values: TransactionFormValues) => {
    if (!user) return;

    setError("");

    const parsed = parseFloat(values.amount.replace(/,/g, ""));

    const { error: createError } = await createTransaction({
      user_id: user.id,
      account_id: values.accountId,
      type: values.type,
      amount: parsed,
      category: values.category,
      description: values.description?.trim() || null,
      date: values.date.toISOString(),
      input_method: inputMethod,
      voice_transcript: inputMethod === "VOICE" ? voiceTranscript : null,
    });

    if (createError) {
      setError("Something went wrong. Please try again.");
      return;
    }

    resetForm(DEFAULT_VALUES(accounts));
    setInputMethod("MANUAL");
    setVoiceTranscript(null);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(root)/(tabs)/transactions");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7F2]" edges={["top"]}>
      <View className="px-5 pt-3 pb-3">
        <Text className="text-[#1A1D26] text-2xl font-bold tracking-tight">
          Add Transaction
        </Text>
        <Text className="text-[#6B6E77] text-xs mt-0.5 font-medium">
          Record a new expense or income
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {loadingAccounts ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4A9EFF" />
          </View>
        ) : accountsError ? (
          <View className="flex-1 items-center justify-center px-10">
            <View className="w-14 h-14 rounded-2xl bg-[#FF6B4A]/10 items-center justify-center mb-3">
              <Feather name="alert-circle" size={28} color="#FF6B4A" />
            </View>
            <Text className="text-[#1A1D26] text-base font-semibold text-center">
              Couldn&apos;t load accounts
            </Text>
            <Text className="text-[#8A8D96] text-xs mt-1 text-center">
              Please check your network and try again.
            </Text>
          </View>
        ) : accounts.length === 0 ? (
          <View className="flex-1 items-center justify-center px-10">
            <View className="w-14 h-14 rounded-2xl bg-[#4A9EFF]/10 items-center justify-center mb-3">
              <Feather name="credit-card" size={28} color="#4A9EFF" />
            </View>
            <Text className="text-[#1A1D26] text-base font-semibold text-center">
              No accounts found
            </Text>
            <Text className="text-[#8A8D96] text-xs mt-1 text-center mb-4">
              You need an account before adding a transaction.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(root)/(tabs)/profile")}
              className="bg-[#1A1D26] px-5 py-2.5 rounded-xl shadow-sm shadow-black/10"
              activeOpacity={0.8}
            >
              <Text className="text-white text-xs font-semibold">
                Go to Profile to Add Account
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 110,
            }}
          >
            {/* AI capture shortcuts */}
            <View className="flex-row gap-3 mb-5 mt-1">
              <AIActionCard
                icon="camera"
                title="Scan Receipt"
                subtitle="Auto-read bill details"
                colors={AI_GRADIENT}
                onPress={() => setScannerOpen(true)}
              />
              <AIActionCard
                icon="mic"
                title="Voice Log"
                subtitle="Speak your expense"
                colors={AI_GRADIENT_REVERSE}
                onPress={() => setVoiceModalOpen(true)}
              />
            </View>

            {/* Type toggle */}
            <View className="flex-row bg-white rounded-2xl border border-[#E8E6DF] p-1.5 mb-5 shadow-sm shadow-black/5">
              {TYPE_OPTIONS.map((t) => {
                const isSelected = type === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    onPress={() => {
                      setValue("type", t.key);
                      setValue(
                        "category",
                        t.key === "INCOME"
                          ? INCOME_CATEGORIES[0].key
                          : EXPENSE_CATEGORIES[0].key
                      );
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: "center",
                      backgroundColor: isSelected ? "#1A1D26" : "transparent",
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: isSelected ? "#FFFFFF" : "#6B6E77",
                      }}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Amount */}
            <Text className="text-[#6B6E77] text-xs font-semibold uppercase tracking-wider mb-2">
              Amount ({currency})
            </Text>
            <Controller
              control={control}
              name="amount"
              render={({ field: { value, onChange, onBlur } }) => (
                <View className="flex-row items-center bg-white border border-[#E8E6DF] rounded-2xl px-4 py-3.5 shadow-sm shadow-black/5">
                  <Text className="text-lg font-bold text-[#1A1D26] mr-2">
                    {currency}
                  </Text>
                  <TextInput
                    value={value}
                    onChangeText={(v) => {
                      setError("");
                      onChange(v);
                    }}
                    onBlur={onBlur}
                    placeholder="0.00"
                    placeholderTextColor="#8A8D96"
                    keyboardType="numeric"
                    className="flex-1 text-lg font-semibold text-[#1A1D26] py-0"
                  />
                </View>
              )}
            />
            {errors.amount && (
              <Text className="text-[#FF6B4A] text-xs mt-1.5 ml-1">
                {errors.amount.message}
              </Text>
            )}
            <View className="mb-5" />

            {/* Category */}
            <Text className="text-[#6B6E77] text-xs font-semibold uppercase tracking-wider mb-2">
              Category
            </Text>
            <View className="mb-5">
              <PillGroup
                options={categories.map((c) => ({
                  key: c.key,
                  label: c.label,
                  icon: c.icon,
                }))}
                value={category}
                onChange={(key) => setValue("category", key)}
              />
            </View>

            {/* Account */}
            <Text className="text-[#6B6E77] text-xs font-semibold uppercase tracking-wider mb-2">
              Account
            </Text>
            <View className="mb-1">
              <PillGroup
                options={accounts.map((a) => ({ key: a.id, label: a.name }))}
                value={accountId}
                onChange={(key) => setValue("accountId", key)}
              />
            </View>
            {errors.accountId && (
              <Text className="text-[#FF6B4A] text-xs mt-1.5 mb-3 ml-1">
                {errors.accountId.message}
              </Text>
            )}
            <View className="mb-4" />

            {/* Date */}
            <Text className="text-[#6B6E77] text-xs font-semibold uppercase tracking-wider mb-2">
              Date
            </Text>
            <TouchableOpacity
              onPress={() => setDatePickerOpen((v) => !v)}
              className="flex-row items-center justify-between bg-white border border-[#E8E6DF] rounded-2xl px-4 py-3.5 mb-1 shadow-sm shadow-black/5"
              activeOpacity={0.7}
            >
              <Text className="text-sm font-medium text-[#1A1D26]">
                {format(date, "d MMM yyyy")}
              </Text>
              <Feather name="calendar" size={17} color="#5C5F68" />
            </TouchableOpacity>

            {datePickerOpen && (
              <View className="bg-white border border-[#E8E6DF] rounded-2xl mb-5 mt-2 p-2 shadow-sm shadow-black/5 overflow-hidden">
                <CalendarPicker
                  value={date}
                  maximumDate={new Date()}
                  onChange={(selectedDate) => {
                    setValue("date", selectedDate);
                    setDatePickerOpen(false);
                  }}
                />
              </View>
            )}
            {!datePickerOpen && <View className="mb-5" />}

            {/* Description */}
            <Text className="text-[#6B6E77] text-xs font-semibold uppercase tracking-wider mb-2">
              Description (optional)
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g. Swiggy lunch, Grocery, Metro recharge"
                  placeholderTextColor="#8A8D96"
                  className="bg-white border border-[#E8E6DF] rounded-2xl px-4 py-3.5 mb-5 text-sm text-[#1A1D26] shadow-sm shadow-black/5"
                />
              )}
            />

            {error ? (
              <View className="bg-[#FF6B4A]/10 border border-[#FF6B4A]/30 rounded-xl px-4 py-3 mb-5">
                <Text className="text-[#FF6B4A] text-xs font-medium">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={saving}
              className="bg-[#1A1D26] rounded-2xl py-4 items-center mb-4 shadow-sm shadow-black/10"
              style={{ opacity: saving ? 0.7 : 1 }}
              activeOpacity={0.85}
            >
              <Text className="text-white text-base font-semibold tracking-wide">
                {saving ? "Saving…" : "Save Transaction"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {scanning && (
        <View className="absolute inset-0 items-center justify-center bg-black/40">
          <View className="bg-white rounded-2xl px-6 py-5 items-center shadow-lg">
            <ActivityIndicator size="large" color="#4A9EFF" />
            <Text className="text-[#1A1D26] text-sm font-semibold mt-3">Reading receipt…</Text>
            <Text className="text-[#8A8D96] text-xs mt-0.5">Gemini AI is parsing the image</Text>
          </View>
        </View>
      )}

      <VoiceRecorderModal
        visible={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onExtracted={handleVoiceExtracted}
      />

      <ReceiptScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onCaptured={handleReceiptCaptured}
      />
    </SafeAreaView>
  );
}
