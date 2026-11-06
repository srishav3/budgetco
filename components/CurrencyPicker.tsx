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
        className="flex-1 bg-[#F8F7F2]"
        edges={["top"]}
      >
        {/* Search bar and Cancel button */}
        <View className="flex-row items-center px-5 pt-3 pb-2 gap-3">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search currency…"
            placeholderTextColor="#8A8D96"
            autoFocus
            className="flex-1 bg-white border border-[#E8E6DF] rounded-full px-4 py-2.5 text-sm text-[#1A1D26]"
          />

          <TouchableOpacity
            onPress={() => {
              setSearch("");
              onClose();
            }}
          >
            <Text className="text-[#6B6E77] text-sm">
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
              className="flex-row items-center px-5 py-3.5 border-b border-[#F0EDE6]"
            >
              {/* Currency symbol */}
              <Text className="text-[#6B6E77] w-8 text-sm">
                {item.symbol}
              </Text>

              {/* Currency code */}
              <Text className="text-[#1A1D26] text-sm font-medium w-12">
                {item.code}
              </Text>

              {/* Currency name */}
              <Text
                className="text-[#6B6E77] text-sm flex-1"
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