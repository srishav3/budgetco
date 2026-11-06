export const CATEGORIES: Record<string, { label: string }> = {
  food: { label: "Food & Dining" },
  groceries: { label: "Groceries" },
  transport: { label: "Transport" },
  shopping: { label: "Shopping" },
  entertainment: { label: "Entertainment" },
  health: { label: "Health" },
  utilities: { label: "Utilities" },
  rent: { label: "Rent" },
  education: { label: "Education" },
  travel: { label: "Travel" },
  insurance: { label: "Insurance" },
  subscriptions: { label: "Subscriptions" },
  emi: { label: "EMI / Loan" },
  personal_care: { label: "Personal Care" },
  other: { label: "Other" },
  salary: { label: "Salary" },
  freelance: { label: "Freelance" },
  business: { label: "Business" },
  investment: { label: "Investment" },
  gift: { label: "Gift" },
  other_income: { label: "Other Income" },
};

export const getCategoryConfig = (key: string) => CATEGORIES[key];

