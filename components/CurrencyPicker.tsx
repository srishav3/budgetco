import { Feather } from "@expo/vector-icons";
import cc from "currency-codes";
import getSymbol from "currency-symbol-map";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type CurrencyEntry = {
  code: string;
  name: string;
  symbol: string;
};

export const ALL_CURRENCIES: CurrencyEntry[] = cc
  .codes()
  .map((code) => ({
    code,
    name: cc.code(code)?.currency ?? code,
    symbol: getSymbol(code) ?? code,
  }))
  .filter((c) => c.symbol !== c.code);

export function CurrencyPicker({
  visible,
  selectedCode,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedCode: string;
  onSelect: (currency: CurrencyEntry) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    if (!q) return ALL_CURRENCIES;

    return ALL_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#F8F7F2",
        }}
        edges={["top"]}
      >
        {/* Search bar and Cancel button */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 8,
            gap: 12,
          }}
        >
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search currency…"
            placeholderTextColor="#8A8D96"
            autoFocus
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E8E6DF",
              borderRadius: 999,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 14,
              color: "#1A1D26",
            }}
          />

          <TouchableOpacity
            onPress={() => {
              setSearch("");
              onClose();
            }}
          >
            <Text
              style={{
                color: "#6B6E77",
                fontSize: 14,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>

        {/* Currency list */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                onSelect(item);
                setSearch("");
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: "#F0EDE6",
              }}
            >
              {/* Currency symbol */}
              <Text
                style={{
                  color: "#6B6E77",
                  width: 32,
                  fontSize: 14,
                }}
              >
                {item.symbol}
              </Text>

              {/* Currency code */}
              <Text
                style={{
                  color: "#1A1D26",
                  fontSize: 14,
                  fontWeight: "500",
                  width: 48,
                }}
              >
                {item.code}
              </Text>

              {/* Currency name */}
              <Text
                style={{
                  color: "#6B6E77",
                  fontSize: 14,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {item.name}
              </Text>

              {/* Selected currency indicator */}
              {item.code === selectedCode && (
                <Feather
                  name="check"
                  size={16}
                  color="#4A9EFF"
                />
              )}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}