import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export type PillOption<T extends string> = {
  key: T;
  label: string;
  icon?: string;
};

export function PillGroup<T extends string>({
  options,
  value,
  onChange,
  scrollable = true,
}: {
  options: PillOption<T>[];
  value: T;
  onChange: (key: T) => void;
  scrollable?: boolean;
}) {
  const row = (
    <View style={{ flexDirection: "row", gap: 8, paddingVertical: 2 }}>
      {options.map((option) => {
        const isSelected = value === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            onPress={() => onChange(option.key)}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 12,
              borderWidth: 1,
              backgroundColor: isSelected ? "#1A1D26" : "#FFFFFF",
              borderColor: isSelected ? "#1A1D26" : "#E8E6DF",
            }}
          >
            {option.icon && (
              <Text style={{ fontSize: 12 }}>{option.icon}</Text>
            )}

            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isSelected ? "#FFFFFF" : "#5C5F68",
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (!scrollable) return row;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 8 }}
    >
      {row}
    </ScrollView>
  );
}
