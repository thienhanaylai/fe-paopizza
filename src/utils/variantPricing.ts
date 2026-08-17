export type VariantPricingInput = {
  price?: number;
  discountType?: "percent" | "amount";
  discount?: number;
};

export const getDiscountedVariantPrice = (variant?: VariantPricingInput | null): number => {
  const basePrice = Math.max(0, Number(variant?.price) || 0);
  const discount = Math.max(0, Number(variant?.discount) || 0);

  if (discount <= 0) return basePrice;

  if (variant?.discountType === "percent") {
    return Math.max(0, Math.round(basePrice * (1 - discount / 100)));
  }

  if (variant?.discountType === "amount") {
    return Math.max(0, basePrice - discount);
  }

  return basePrice;
};
