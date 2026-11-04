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
    <View
      style={{
        flexDirection: "row",
        gap: 8,
      }}
    >
      {options.map((option) => (
        <TouchableOpacity
          key={option.key}
          onPress={() => onChange(option.key)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
            borderWidth: 1,
            backgroundColor:
              value === option.key ? "#0B0E14" : "#FFFFFF",
            borderColor:
              value === option.key ? "#0B0E14" : "#E8E6DF",
          }}
        >
          {option.icon && (
            <Text style={{ fontSize: 12 }}>
              {option.icon}
            </Text>
          )}

          <Text
            style={{
              fontSize: 12,
              color:
                value === option.key ? "#FFFFFF" : "#8A8D96",
            }}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!scrollable) return row;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {row}
    </ScrollView>
  );
}