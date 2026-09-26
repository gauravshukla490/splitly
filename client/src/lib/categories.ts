// Same expense categories as WiseMoney
export const EXPENSE_CATEGORIES = [
  { id: "foodDrink", name: "Food & Drink" },
  { id: "coffee", name: "Coffee" },
  { id: "groceries", name: "Groceries" },
  { id: "shopping", name: "Shopping" },
  { id: "travel", name: "Travel" },
  { id: "transportation", name: "Transportation" },
  { id: "housing", name: "Housing" },
  { id: "entertainment", name: "Entertainment" },
  { id: "tickets", name: "Tickets" },
  { id: "utilities", name: "Utilities" },
  { id: "water", name: "Water" },
  { id: "education", name: "Education" },
  { id: "health", name: "Health" },
  { id: "personal", name: "Personal" },
  { id: "gifts", name: "Gifts" },
  { id: "technology", name: "Technology" },
  { id: "bills", name: "Bills & Fees" },
  { id: "baby", name: "Baby & Kids" },
  { id: "music", name: "Music" },
  { id: "books", name: "Books" },
  { id: "other", name: "Other" },
  { id: "general", name: "General Expense" },
];

export const getCategoryName = (id: string) =>
  EXPENSE_CATEGORIES.find((c) => c.id === id)?.name ?? "Other";
