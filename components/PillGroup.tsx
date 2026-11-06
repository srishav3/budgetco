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
    <View className="flex-row gap-2 py-0.5">
      {options.map((option) => {
        const isSelected = value === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            onPress={() => onChange(option.key)}
            className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl border ${
              isSelected
                ? "bg-[#1A1D26] border-[#1A1D26] shadow-sm shadow-black/10"
                : "bg-white border-[#E8E6DF]"
            }`}
            activeOpacity={0.8}
          >
            {option.icon && <Text className="text-xs">{option.icon}</Text>}

            <Text
              className={`text-xs font-semibold ${
                isSelected ? "text-white" : "text-[#5C5F68]"
              }`}
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
