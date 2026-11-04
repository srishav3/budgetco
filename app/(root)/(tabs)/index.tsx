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
      style={{
        flex: 1,
        backgroundColor: "#1A1D26",
      }}
      edges={["top"]}
    >
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: "#F8F7F2",
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Dark hero header */}
        <View
          style={{
            backgroundColor: "#1A1D26",
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 22,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 22,
            }}
          >
            <Image
              source={require("../../../assets/images/budgetco-light-theme-logo.png")}
              style={{
                width: 80,
                height: 40,
              }}
              contentFit="contain"
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <View
                style={{
                  alignItems: "flex-end",
                }}
              >
                <Text
                  style={{
                    color: "#8A8D96",
                    fontSize: 12,
                  }}
                >
                  {getGreeting()}
                </Text>

                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "500",
                  }}
                >
                  {user?.firstName ?? "there"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  router.push("/(root)/(tabs)/profile")
                }
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: "#1A1D26",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {user?.imageUrl && user.hasImage ? (
                  <Image
                    source={{ uri: user.imageUrl }}
                    style={{
                      width: 38,
                      height: 38,
                    }}
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
          <View
            style={{
              marginBottom: 22,
            }}
          >
            <Text
              style={{
                color: "#8A8D96",
                fontSize: 12,
                marginBottom: 6,
              }}
            >
              Total balance
            </Text>

            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 38,
                fontWeight: "500",
                letterSpacing: -0.5,
              }}
            >
              {formatPrice(totalBalance, currency)}
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: 14,
                marginTop: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Feather
                  name="arrow-up-right"
                  size={14}
                  color="#3DDC84"
                />

                <Text
                  style={{
                    color: "#3DDC84",
                    fontSize: 13,
                  }}
                >
                  {formatPrice(monthIncome, currency)}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Feather
                  name="arrow-down-right"
                  size={14}
                  color="#FF6B4A"
                />

                <Text
                  style={{
                    color: "#FF6B4A",
                    fontSize: 13,
                  }}
                >
                  {formatPrice(monthExpense, currency)}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick actions */}
          <View
            style={{
              flexDirection: "row",
              gap: 10,
            }}
          >
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
                style={{
                  flex: 1,
                  backgroundColor: "#252933",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#343943",
                  paddingVertical: 16,
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: `${action.color}26`,
                  }}
                >
                  <Feather
                    name={action.icon}
                    size={17}
                    color={action.color}
                  />
                </View>

                <Text
                  style={{
                    color: "#B8BAC2",
                    fontSize: 11,
                    fontWeight: "500",
                    textAlign: "center",
                  }}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Light body */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 20,
          }}
        >
          {/* AI assistant shortcut */}
          <TouchableOpacity
            onPress={() =>
              router.push("/(root)/(tabs)/assistant")
            }
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#E8E6DF",
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: "#4A9EFF1A",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: "#4A9EFF",
                }}
              />
            </View>

            <Text
              style={{
                color: "#8A8D96",
                fontSize: 13,
                flex: 1,
              }}
            >
              Ask AI anything about your money
            </Text>

            <Feather
              name="arrow-right"
              size={16}
              color="#4A9EFF"
            />
          </TouchableOpacity>

          {/* Monthly budget */}
          <TouchableOpacity
            onPress={() => setBudgetModalOpen(true)}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#E8E6DF",
              padding: 16,
              marginBottom: 18,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: "#1A1D26",
                  fontSize: 14,
                  fontWeight: "500",
                }}
              >
                Monthly budget
              </Text>

              <Feather
                name="edit-2"
                size={13}
                color="#8A8D96"
              />
            </View>

            {budget ? (
              <>
                <Text
                  style={{
                    color: "#8A8D96",
                    fontSize: 12,
                    marginBottom: 8,
                  }}
                >
                  {formatPrice(monthExpense, currency)} of{" "}
                  {formatPrice(budget.amount, currency)} spent
                </Text>

                <View
                  style={{
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: "#F0EEE7",
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: 8,
                      borderRadius: 999,
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
              <Text
                style={{
                  color: "#8A8D96",
                  fontSize: 12,
                }}
              >
                Tap to set a monthly spending budget
              </Text>
            )}
          </TouchableOpacity>

          {/* Expense breakdown */}
          {expenseBreakdown.length > 0 && (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 18,
                borderWidth: 1,
                borderColor: "#E8E6DF",
                padding: 16,
                marginBottom: 18,
              }}
            >
              <Text
                style={{
                  color: "#1A1D26",
                  fontSize: 14,
                  fontWeight: "500",
                  marginBottom: 12,
                }}
              >
                Expense breakdown (this month)
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <PieChart
                  data={expenseBreakdown.map((c) => ({
                    value: c.amount,
                    color: c.color,
                  }))}
                  radius={60}
                  innerRadius={38}
                  innerCircleColor="#FFFFFF"
                />

                <View
                  style={{
                    flex: 1,
                    marginLeft: 16,
                    gap: 6,
                  }}
                >
                  {expenseBreakdown.slice(0, 6).map((c) => (
                    <View
                      key={c.category}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          flex: 1,
                          marginRight: 4,
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: c.color,
                          }}
                        />

                        <Text
                          numberOfLines={1}
                          style={{
                            color: "#8A8D96",
                            fontSize: 11,
                            flexShrink: 1,
                          }}
                        >
                          {getCategoryConfig(c.category).label}
                        </Text>
                      </View>

                      <Text
                        style={{
                          color: "#1A1D26",
                          fontSize: 11,
                          fontWeight: "500",
                        }}
                      >
                        {formatPrice(c.amount, currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Recent transactions header */}
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
                color: "#1A1D26",
                fontSize: 14,
                fontWeight: "500",
              }}
            >
              Recent transactions
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.push("/(root)/(tabs)/transactions")
              }
            >
              <Text
                style={{
                  color: "#8A8D96",
                  fontSize: 12,
                }}
              >
                See all
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent transactions list */}
          {loading ? (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 24,
              }}
            >
              <ActivityIndicator color="#4A9EFF" />
            </View>
          ) : recentTransactions.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 24,
              }}
            >
              <Feather
                name="inbox"
                size={28}
                color="#BDC3C7"
              />

              <Text
                style={{
                  color: "#8A8D96",
                  fontSize: 14,
                  marginTop: 12,
                }}
              >
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