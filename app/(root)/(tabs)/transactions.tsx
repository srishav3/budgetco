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

  const getChipStyle = (selected: boolean) => ({
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: selected ? COLORS.background : COLORS.border,
    backgroundColor: selected ? COLORS.background : COLORS.white,
  });

  const getChipTextStyle = (selected: boolean) => ({
    color: selected ? COLORS.white : COLORS.secondaryText,
    fontSize: 12,
  });

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.body,
      }}
      edges={["top"]}
    >
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: COLORS.background,
              fontSize: 20,
              fontWeight: "600",
            }}
          >
            Transactions
          </Text>

          <TouchableOpacity
            onPress={handleExport}
            disabled={exporting}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: COLORS.white,
              borderWidth: 1,
              borderColor: COLORS.border,
              alignItems: "center",
              justifyContent: "center",
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
                size={15}
                color="#5C5F68"
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: COLORS.white,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginBottom: 10,
          }}
        >
          <Feather
            name="search"
            size={15}
            color={COLORS.mutedText}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions"
            placeholderTextColor={COLORS.mutedText}
            style={{
              flex: 1,
              fontSize: 12,
              color: COLORS.background,
              paddingVertical: 0,
            }}
          />

          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather
                name="x"
                size={15}
                color={COLORS.mutedText}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Transaction type filters */}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginBottom: 10,
          }}
        >
          {FILTERS.map((filter) => {
            const selected = activeFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={getChipStyle(selected)}
              >
                <Text style={getChipTextStyle(selected)}>
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
        >
          <View
            style={{
              flexDirection: "row",
              gap: 8,
            }}
          >
            <TouchableOpacity
              onPress={() => setActiveAccountId(null)}
              style={getChipStyle(activeAccountId === null)}
            >
              <Text
                style={getChipTextStyle(activeAccountId === null)}
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
                  style={getChipStyle(selected)}
                >
                  <Text style={getChipTextStyle(selected)}>
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
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color={COLORS.blue} />
        </View>
      ) : error ? (
        /* Error state */
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <Feather
            name="alert-circle"
            size={32}
            color={COLORS.coral}
          />

          <Text
            style={{
              color: COLORS.mutedText,
              fontSize: 14,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            Couldn&apos;t load transactions.
          </Text>

          <TouchableOpacity
            onPress={loadData}
            style={{
              marginTop: 16,
              backgroundColor: COLORS.background,
              borderRadius: 999,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                color: COLORS.white,
                fontSize: 12,
                fontWeight: "500",
              }}
            >
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
            paddingBottom: 100,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadData}
            />
          }
          ListHeaderComponent={
            transactions.length > 0 ? (
              <View
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.background,
                      fontSize: 12,
                      fontWeight: "500",
                    }}
                  >
                    Daily income vs expense
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: COLORS.success,
                        }}
                      />

                      <Text
                        style={{
                          fontSize: 10,
                          color: COLORS.secondaryText,
                        }}
                      >
                        Income
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: COLORS.coral,
                        }}
                      />

                      <Text
                        style={{
                          fontSize: 10,
                          color: COLORS.secondaryText,
                        }}
                      >
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
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 80,
              }}
            >
              <Feather
                name="inbox"
                size={32}
                color={COLORS.iconMuted}
              />

              <Text
                style={{
                  color: COLORS.mutedText,
                  fontSize: 14,
                  marginTop: 12,
                }}
              >
                {search
                  ? "No matching transactions"
                  : "No transactions yet"}
              </Text>
            </View>
          }
        />
      )}

      {/* Add transaction FAB */}
      <TouchableOpacity
        onPress={() =>
          router.push("/(root)/(tabs)/add-transaction")
        }
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: COLORS.background,
          alignItems: "center",
          justifyContent: "center",
          elevation: 8,
          shadowColor: "#000000",
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.2,
          shadowRadius: 5,
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