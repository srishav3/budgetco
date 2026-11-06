import { BudgetModal } from "../../../components/BudgetModal";
import { TransactionRow } from "@/components/TransactionRow";
import { getCategoryConfig } from "@/constants/categories";
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery";
import { useBudgetQuery } from "@/hooks/queries/useBudgetQuery";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import { Transaction } from "@/lib/services/transactions";
import { formatPrice } from "../../../lib/utils";
import { useUserStore } from "@/store/userStore";
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { isSameMonth } from "date-fns";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}

const QUICK_ACTIONS = [
  {
    icon: "camera",
    label: "AI Receipt Scan",
    action: "scan",
    color: "#1A85FF",
  },
  {
    icon: "mic",
    label: "Voice Entry",
    action: "voice",
    color: "#FF6B4A",
  },
  {
    icon: "plus",
    label: "Add Manually",
    action: "manual",
    color: "#3DDC84",
  },
] as const;

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const currency = useUserStore((s) => s.currency);

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

  const {
    data: accounts = [],
    isLoading: accountsLoading,
    isRefetching: accountsRefetching,
    refetch: refetchAccounts,
  } = useAccountsQuery();

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    isRefetching: transactionsRefetching,
    refetch: refetchTransactions,
  } = useTransactionsQuery();

  const { data: budget = null, refetch: refetchBudget } = useBudgetQuery();

  const loading = accountsLoading || transactionsLoading;
  const refreshing = accountsRefetching || transactionsRefetching;

  const onRefresh = () => {
    refetchAccounts();
    refetchTransactions();
    refetchBudget();
  };

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts]
  );

  const monthTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter((tx) =>
      isSameMonth(new Date(tx.date), now)
    );
  }, [transactions]);

  const monthIncome = useMemo(
    () =>
      monthTransactions
        .filter((tx) => tx.type === "INCOME")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [monthTransactions]
  );

  const monthExpense = useMemo(
    () =>
      monthTransactions
        .filter((tx) => tx.type === "EXPENSE")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [monthTransactions]
  );

  const recentTransactions = useMemo(
    () => transactions.slice(0, 5),
    [transactions]
  );

  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {};

    monthTransactions
      .filter((tx) => tx.type === "EXPENSE")
      .forEach((tx) => {
        map[tx.category] = (map[tx.category] ?? 0) + tx.amount;
      });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category: category as Transaction["category"],
        amount,
        color: getCategoryConfig(
          category as Transaction["category"]
        ).color,
      }));
  }, [monthTransactions]);

  return (
    <SafeAreaView
      className="flex-1 bg-[#1A1D26]"
      edges={["top"]}
    >
      <ScrollView
        className="flex-1 bg-[#F8F7F2]"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Dark hero header */}
        <View className="bg-[#1A1D26] rounded-b-[32px] px-5 pt-5 pb-6 shadow-md shadow-black/20">
          <View className="flex-row justify-between items-center mb-5">
            <Image
              source={require("../../../assets/images/budgetco-light-theme-logo.png")}
              className="w-20 h-10"
              contentFit="contain"
            />

            <View className="flex-row items-center gap-2.5">
              <View className="items-end">
                <Text className="text-[#8A8D96] text-xs">
                  {getGreeting()}
                </Text>

                <Text className="text-white text-base font-semibold">
                  {user?.firstName ?? "there"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  router.push("/(root)/(tabs)/profile")
                }
                className="w-10 h-10 rounded-full bg-[#252933] border border-[#343943] items-center justify-center overflow-hidden"
              >
                {user?.imageUrl && user.hasImage ? (
                  <Image
                    source={{ uri: user.imageUrl }}
                    className="w-10 h-10"
                    contentFit="cover"
                  />
                ) : (
                  <Feather
                    name="user"
                    size={18}
                    color="#8A8D96"
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Balance summary */}
          <View className="mb-5">
            <Text className="text-[#8A8D96] text-xs font-medium uppercase tracking-wider mb-1.5">
              Total balance
            </Text>

            <Text className="text-white text-4xl font-bold tracking-tight">
              {formatPrice(totalBalance, currency)}
            </Text>

            <View className="flex-row gap-3 mt-3">
              <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Feather
                  name="arrow-up-right"
                  size={13}
                  color="#3DDC84"
                />

                <Text className="text-[#3DDC84] text-xs font-medium">
                  {formatPrice(monthIncome, currency)}
                </Text>
              </View>

              <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Feather
                  name="arrow-down-right"
                  size={13}
                  color="#FF6B4A"
                />

                <Text className="text-[#FF6B4A] text-xs font-medium">
                  {formatPrice(monthExpense, currency)}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick actions */}
          <View className="flex-row gap-2.5">
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                onPress={() =>
                  router.push({
                    pathname: "/(root)/(tabs)/add-transaction",
                    params: { action: action.action },
                  })
                }
                activeOpacity={0.75}
                className="flex-1 bg-[#252933] rounded-2xl border border-[#343943] py-3.5 px-2 items-center gap-2 shadow-sm"
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: `${action.color}26`,
                  }}
                >
                  <Feather
                    name={action.icon}
                    size={18}
                    color={action.color}
                  />
                </View>

                <Text className="text-[#D1D3D9] text-[11px] font-semibold text-center leading-3.5">
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Light body */}
        <View className="px-5 pt-5 pb-24">
          {/* AI assistant shortcut */}
          <TouchableOpacity
            onPress={() =>
              router.push("/(root)/(tabs)/assistant")
            }
            className="bg-white rounded-2xl border border-[#E8E6DF] p-4 flex-row items-center gap-3 mb-4 shadow-sm shadow-black/5"
            activeOpacity={0.8}
          >
            <View className="w-8 h-8 rounded-full bg-[#1A85FF]/10 items-center justify-center">
              <View className="w-2 h-2 rounded-full bg-[#1A85FF]" />
            </View>

            <View className="flex-1">
              <Text className="text-[#1A1D26] text-xs font-semibold mb-0.5">
                AI Financial Assistant
              </Text>
              <Text className="text-[#8A8D96] text-xs">
                Ask anything about your spending or budgets
              </Text>
            </View>

            <Feather
              name="arrow-right"
              size={16}
              color="#1A85FF"
            />
          </TouchableOpacity>

          {/* Monthly budget */}
          <TouchableOpacity
            onPress={() => setBudgetModalOpen(true)}
            activeOpacity={0.85}
            className="bg-white rounded-2xl border border-[#E8E6DF] p-5 mb-4 shadow-sm shadow-black/5"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-[#1A1D26] text-sm font-semibold">
                Monthly budget
              </Text>

              <View className="flex-row items-center gap-1">
                <Text className="text-[#8A8D96] text-xs">Edit</Text>
                <Feather
                  name="chevron-right"
                  size={14}
                  color="#8A8D96"
                />
              </View>
            </View>

            {budget ? (
              <>
                <Text className="text-[#8A8D96] text-xs mb-2.5">
                  <Text className="font-semibold text-[#1A1D26]">
                    {formatPrice(monthExpense, currency)}
                  </Text>{" "}
                  of {formatPrice(budget.amount, currency)} spent
                </Text>

                <View className="h-2.5 rounded-full bg-[#F0EEE7] overflow-hidden">
                  <View
                    className="h-2.5 rounded-full"
                    style={{
                      width: `${
                        budget.amount > 0
                          ? Math.min(
                              Math.round(
                                (monthExpense / budget.amount) * 100
                              ),
                              100
                            )
                          : 0
                      }%`,
                      backgroundColor:
                        monthExpense >= budget.amount
                          ? "#FF6B4A"
                          : monthExpense >= budget.amount * 0.8
                            ? "#F7DC6F"
                            : "#3DDC84",
                    }}
                  />
                </View>
              </>
            ) : (
              <Text className="text-[#8A8D96] text-xs">
                Tap to set a monthly spending budget
              </Text>
            )}
          </TouchableOpacity>

          {/* Expense breakdown */}
          {expenseBreakdown.length > 0 && (
            <View className="bg-white rounded-2xl border border-[#E8E6DF] p-5 mb-5 shadow-sm shadow-black/5">
              <Text className="text-[#1A1D26] text-sm font-semibold mb-4">
                Expense breakdown (this month)
              </Text>

              <View className="flex-row items-center">
                <PieChart
                  data={expenseBreakdown.map((c) => ({
                    value: c.amount,
                    color: c.color,
                  }))}
                  radius={60}
                  innerRadius={38}
                  innerCircleColor="#FFFFFF"
                />

                <View className="flex-1 ml-4 gap-2">
                  {expenseBreakdown.slice(0, 6).map((c) => (
                    <View
                      key={c.category}
                      className="flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center gap-2 flex-1 mr-2">
                        <View
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: c.color,
                          }}
                        />

                        <Text
                          numberOfLines={1}
                          className="text-[#8A8D96] text-xs shrink"
                        >
                          {getCategoryConfig(c.category).label}
                        </Text>
                      </View>

                      <Text className="text-[#1A1D26] text-xs font-semibold">
                        {formatPrice(c.amount, currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Recent transactions header */}
          <View className="flex-row justify-between items-center mb-3.5 px-0.5">
            <Text className="text-[#1A1D26] text-base font-semibold">
              Recent transactions
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.push("/(root)/(tabs)/transactions")
              }
            >
              <Text className="text-[#1A85FF] text-xs font-semibold">
                See all
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent transactions list */}
          {loading ? (
            <View className="items-center py-6">
              <ActivityIndicator color="#4A9EFF" />
            </View>
          ) : recentTransactions.length === 0 ? (
            <View className="items-center py-6">
              <Feather
                name="inbox"
                size={28}
                color="#BDC3C7"
              />

              <Text className="text-[#8A8D96] text-sm mt-3">
                No transactions yet
              </Text>
            </View>
          ) : (
            recentTransactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))
          )}
        </View>
      </ScrollView>

      {user && (
        <BudgetModal
          visible={budgetModalOpen}
          budget={budget}
          onClose={() => setBudgetModalOpen(false)}
          onSaved={() => setBudgetModalOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}