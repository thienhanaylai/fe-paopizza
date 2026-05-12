export type FormatVNDOptions = {
  style?: "standard" | "currency";
  round?: boolean;
};

export function formatVND(value: number, options: FormatVNDOptions = {}): string {
  const { style = "standard", round = false } = options;
  const amount = round ? Math.round(value) : value;

  if (style === "currency") {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  }

  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}
