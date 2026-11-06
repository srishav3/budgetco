import { TransactionRow } from "@/components/TransactionRow";
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import { useDeleteTransaction } from "@/hooks/mutations/useTransactionMutations";
import {
  Transaction,
  TransactionType,
} from "@/lib/services/transactions";
import { exportTransactionsToCsv } from "@/lib/utils/exportTransactions";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  eachDayOfInterval,
  format,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  background: "#1A1D26",
  body: "#F8F7F2",
  white: "#FFFFFF",
  border: "#E8E6DF",
  secondaryText: "#6B6E77",
  mutedText: "#8A8D96",
  success: "#3DDC84",
  coral: "#FF6B4A",
  blue: "#4A9EFF",
  chartRules: "#F0EEE7",
  iconMuted: "#BDC3C7",
};

const FILTERS = ["All", "Income", "Expense"] as const;

function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function currentMonthDays() {
  const today = startOfDay(new Date());

  return eachDayOfInterval({
    start: startOfMonth(today),
    end: today,
  }).map((d) => ({
    key: dayKey(d),
    label: format(d, "d MMM"),
  }));
}

export default function TransactionsScreen() {
  const router = useRouter();

  const [activeFilter, setActiveFilter] =
    useState<(typeof FILTERS)[number]>("All");
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const typeFilter: TransactionType | null =
    activeFilter === "Income"
      ? "INCOME"
      : activeFilter === "Expense"
        ? "EXPENSE"
        : null;

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    isRefetching: transactionsRefetching,
    isError: transactionsError,
    refetch: refetchTransactions,
  } = useTransactionsQuery({
    type: typeFilter,
    accountId: activeAccountId,
  });

  const {
    data: accounts = [],
    refetch: refetchAccounts,
  } = useAccountsQuery();

  const { mutateAsync: removeTransaction } = useDeleteTransaction();

  const loading = transactionsLoading;
  const refreshing = transactionsRefetching;
  const error = transactionsError;

  const loadData = () => {
    refetchTransactions();
    refetchAccounts();
  };

  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return transactions;

    return transactions.filter(
      (tx) =>
        tx.description?.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q)
    );
  }, [transactions, search]);

  const dailyIncomeExpense = useMemo(() => {
    const days = currentMonthDays();

    return days.flatMap(({ key, label }) => {
      const income = transactions
        .filter(
          (tx) =>
            tx.type === "INCOME" &&
            dayKey(new Date(tx.date)) === key
        )
        .reduce((sum, tx) => sum + tx.amount, 0);

      const expense = transactions
        .filter(
          (tx) =>
            tx.type === "EXPENSE" &&
            dayKey(new Date(tx.date)) === key
        )
        .reduce((sum, tx) => sum + tx.amount, 0);

      return [
        {
          value: income,
          label,
          frontColor: COLORS.success,
        },
        {
          value: expense,
          frontColor: COLORS.coral,
        },
      ];
    });
  }, [transactions]);

  const handleExport = async () => {
    if (exporting) return;

    setExporting(true);

    try {
      const { count } = await exportTransactionsToCsv(transactions);

      if (count === 0) {
        Alert.alert(
          "Nothing to export",
          "No transactions in the export window."
        );
      }
    } catch (err) {
      console.error("Export failed:", err);
      Alert.alert("Error", "Couldn't export transactions.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = (tx: Transaction) => {
    Alert.alert(
      "Delete transaction",
      "Are you sure you want to delete this transaction?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error: deleteError } = await removeTransaction(tx);

            if (deleteError) {
              Alert.alert("Error", "Couldn't delete this transaction.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-[#F8F7F2]"
      edges={["top"]}
    >
      <View className="px-5 pt-3 pb-3">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[#1A1D26] text-2xl font-bold tracking-tight">
              Transactions
            </Text>
            <Text className="text-[#6B6E77] text-xs mt-0.5 font-medium">
              {transactions.length} record{transactions.length === 1 ? "" : "s"} found
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleExport}
            disabled={exporting}
            className="w-10 h-10 rounded-2xl bg-white border border-[#E8E6DF] items-center justify-center shadow-sm shadow-black/5 active:bg-[#F2EFE9]"
            style={{
              opacity: exporting ? 0.7 : 1,
            }}
          >
            {exporting ? (
              <ActivityIndicator
                size="small"
                color="#5C5F68"
              />
            ) : (
              <Feather
                name="download"
                size={16}
                color="#1A1D26"
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="flex-row items-center gap-2.5 bg-white rounded-2xl border border-[#E8E6DF] px-3.5 py-3 mb-3 shadow-sm shadow-black/5">
          <Feather
            name="search"
            size={16}
            color={COLORS.mutedText}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by category or description…"
            placeholderTextColor={COLORS.mutedText}
            className="flex-1 text-[13px] text-[#1A1D26] py-0"
          />

          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather
                name="x"
                size={16}
                color={COLORS.mutedText}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Transaction type filters */}
        <View className="flex-row gap-2 mb-2.5">
          {FILTERS.map((filter) => {
            const selected = activeFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-xl border ${
                  selected
                    ? "bg-[#1A1D26] border-[#1A1D26] shadow-sm shadow-black/10"
                    : "bg-white border-[#E8E6DF]"
                }`}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selected ? "text-white" : "text-[#6B6E77]"
                  }`}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Account filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 8 }}
        >
          <View className="flex-row gap-2 py-0.5">
            <TouchableOpacity
              onPress={() => setActiveAccountId(null)}
              className={`px-3.5 py-1.5 rounded-xl border ${
                activeAccountId === null
                  ? "bg-[#1A1D26] border-[#1A1D26]"
                  : "bg-white border-[#E8E6DF]"
              }`}
              activeOpacity={0.8}
            >
              <Text
                className={`text-xs font-medium ${
                  activeAccountId === null ? "text-white" : "text-[#6B6E77]"
                }`}
              >
                All Accounts
              </Text>
            </TouchableOpacity>

            {accounts.map((account) => {
              const selected = activeAccountId === account.id;

              return (
                <TouchableOpacity
                  key={account.id}
                  onPress={() => setActiveAccountId(account.id)}
                  className={`px-3.5 py-1.5 rounded-xl border ${
                    selected
                      ? "bg-[#1A1D26] border-[#1A1D26]"
                      : "bg-white border-[#E8E6DF]"
                  }`}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`text-xs font-medium ${
                      selected ? "text-white" : "text-[#6B6E77]"
                    }`}
                  >
                    {account.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Loading state */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      ) : error ? (
        /* Error state */
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-14 h-14 rounded-2xl bg-[#FF6B4A]/10 items-center justify-center mb-3">
            <Feather
              name="alert-circle"
              size={28}
              color={COLORS.coral}
            />
          </View>

          <Text className="text-[#1A1D26] text-base font-semibold text-center">
            Couldn&apos;t load transactions
          </Text>
          <Text className="text-[#8A8D96] text-xs mt-1 text-center">
            Check your network connection and try again.
          </Text>

          <TouchableOpacity
            onPress={loadData}
            className="mt-5 bg-[#1A1D26] rounded-xl px-5 py-2.5 shadow-sm shadow-black/10 active:opacity-90"
          >
            <Text className="text-white text-xs font-semibold">
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Transactions list */
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionRow
              tx={item}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 110,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadData}
            />
          }
          ListHeaderComponent={
            transactions.length > 0 ? (
              <View className="bg-white rounded-2xl border border-[#E8E6DF] p-4.5 mb-4 shadow-sm shadow-black/5">
                <View className="flex-row justify-between items-center mb-3.5">
                  <Text className="text-[#1A1D26] text-xs font-semibold tracking-wide">
                    Daily Activity (This Month)
                  </Text>

                  <View className="flex-row gap-3">
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-2 h-2 rounded-full bg-[#3DDC84]" />
                      <Text className="text-[11px] font-medium text-[#6B6E77]">
                        Income
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-1.5">
                      <View className="w-2 h-2 rounded-full bg-[#FF6B4A]" />
                      <Text className="text-[11px] font-medium text-[#6B6E77]">
                        Expense
                      </Text>
                    </View>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  <BarChart
                    data={dailyIncomeExpense}
                    width={Math.max(dailyIncomeExpense.length * 9, 280)}
                    height={120}
                    barWidth={6}
                    spacing={4}
                    hideYAxisText
                    xAxisColor={COLORS.border}
                    yAxisColor="transparent"
                    rulesColor={COLORS.chartRules}
                    noOfSections={3}
                    xAxisLabelTextStyle={{
                      color: COLORS.mutedText,
                      fontSize: 7,
                    }}
                    isThreeD={false}
                    roundedTop
                  />
                </ScrollView>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <View className="w-14 h-14 rounded-2xl bg-[#E8E6DF]/50 items-center justify-center mb-3">
                <Feather
                  name="inbox"
                  size={26}
                  color={COLORS.iconMuted}
                />
              </View>

              <Text className="text-[#1A1D26] text-sm font-semibold">
                {search ? "No matching transactions" : "No transactions yet"}
              </Text>
              <Text className="text-[#8A8D96] text-xs mt-1 text-center">
                {search
                  ? "Try searching for a different keyword"
                  : "Tap the + button below to add your first transaction"}
              </Text>
            </View>
          }
        />
      )}

      {/* Add transaction FAB - elevated above the bottom tab bar */}
      <TouchableOpacity
        onPress={() =>
          router.push("/(root)/(tabs)/add-transaction")
        }
        className="absolute right-5 w-14 h-14 rounded-2xl bg-[#1A1D26] items-center justify-center shadow-lg"
        style={{
          bottom: Platform.OS === "ios" ? 95 : 84,
          elevation: 8,
          shadowColor: "#000000",
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.25,
          shadowRadius: 6,
        }}
        activeOpacity={0.85}
      >
        <Feather
          name="plus"
          size={24}
          color={COLORS.white}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
