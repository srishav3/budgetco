import { getCategoryConfig } from "@/constants/categories";
import { Transaction } from "@/lib/services/transactions";
import { formatPrice } from "../lib/utils";
import { Feather } from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Text, TouchableOpacity, View } from "react-native";
import { useUserStore } from "@/store/userStore";

const INPUT_METHOD_ICON: Record<
  Transaction["input_method"],
  keyof typeof Feather.glyphMap
> = {
  MANUAL: "edit-3",
  RECEIPT_SCAN: "camera",
  VOICE: "mic",
};

export function TransactionRow({
  tx,
  onDelete,
}: {
  tx: Transaction;
  onDelete?: () => void;
}) {
  const config = getCategoryConfig(tx.category);
  const isIncome = tx.type === "INCOME";
  const currency = useUserStore((state) => state.currency);

  const row = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E8E6DF",
        paddingLeft: 12,
        paddingRight: 14,
        paddingVertical: 16,
        borderLeftWidth: 3,
        borderLeftColor: config.color,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          backgroundColor: `${config.color}22`,
        }}
      >
        <Text style={{ fontSize: 18 }}>{config.icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{
            color: "#1A1D26",
            fontSize: 14,
            fontWeight: "500",
          }}
        >
          {tx.description || config.label}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 2,
          }}
        >
          <Feather
            name={INPUT_METHOD_ICON[tx.input_method]}
            size={11}
            color="#8A8D96"
          />

          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 999,
              backgroundColor: `${config.color}1A`,
            }}
          >
            <Text
              style={{
                color: config.color,
                fontSize: 10,
                fontWeight: "500",
              }}
            >
              {config.label}
            </Text>
          </View>

          {tx.is_flagged && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginLeft: 4,
              }}
            >
              <Feather
                name="alert-triangle"
                size={11}
                color="#FF6B4A"
              />
              <Text style={{ color: "#FF6B4A", fontSize: 11 }}>
                Flagged
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text
        style={{
          color: isIncome ? "#3DDC84" : "#FF6B4A",
          fontSize: 14,
          fontWeight: "500",
        }}
      >
        {isIncome ? "+" : "-"}
        {formatPrice(tx.amount, currency)}
      </Text>
    </View>
  );

  if (!onDelete) {
    return <View style={{ marginBottom: 10 }}>{row}</View>;
  }

  return (
    <View style={{ marginBottom: 10 }}>
      <Swipeable
        overshootRight={false}
        renderRightActions={() => (
          <TouchableOpacity
            onPress={onDelete}
            style={{
              backgroundColor: "#FF6B4A",
              borderRadius: 16,
              marginLeft: 8,
              width: 64,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="trash-2" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      >
        {row}
      </Swipeable>
    </View>
  );
}