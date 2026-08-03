import type { IngredientData } from "@/src/services/ingredient.service";

export type MenuCategoryUI = {
  slug: string;
  name: string;
  icon: string;
};

export type ExtraTopping = IngredientData;

export type ComboSlotSelection = {
  productId: string;
  sku: string;
  size: string;
  crust?: string;
};
