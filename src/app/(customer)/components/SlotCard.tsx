"use client";

import Image from "next/image";
import { parseCrustOptions } from "../utils";
import { formatCrustLabel } from "@/src/utils/formatCrustLabel";
import type { Product } from "@/src/services/menu.service";
import type { ComboSlotSelection } from "../types";

interface SlotCardProps {
  product: Product;
  variant: Product["variants"][number];
  selectedCrust?: string;
  ruleIdx: number;
  slotIdx?: number;
  applicableSizes?: string[];
  onChangeVariant: (
    ruleIdx: number,
    slotIdx: number,
    productId: string,
    newSku: string,
    newSize: string,
    newCrust?: string,
  ) => void;
  onReplace?: (ruleIdx: number, slotIdx: number) => void;
  showReplace?: boolean;
}

export default function SlotCard({
  product,
  variant,
  selectedCrust,
  ruleIdx,
  slotIdx,
  applicableSizes,
  onChangeVariant,
  onReplace,
  showReplace,
}: SlotCardProps) {
  const allVariants = product.variants;
  const allSizes = Array.from(new Set(allVariants.map(v => v.size)));
  // Lọc size theo applicableSizes của rule (nếu có)
  const sizes = applicableSizes && applicableSizes.length > 0 ? allSizes.filter(s => applicableSizes.includes(s)) : allSizes;
  const currentSize = variant.size;
  const crustsForSize = Array.from(
    new Set(
      allVariants
        .filter(v => v.size === currentSize)
        .flatMap(v => parseCrustOptions(v.crust))
        .filter(Boolean),
    ),
  );
  const isPizza = product.category?.slug?.toLowerCase().includes("pizza");
  const activeCrust = selectedCrust || parseCrustOptions(variant.crust)[0];

  const findVariantBySizeCrust = (size: string, crust?: string) => {
    return allVariants.find(v => {
      if (v.size !== size) return false;
      if (!crust) return true;
      return parseCrustOptions(v.crust).includes(crust);
    });
  };

  const handleSizeChange = (size: string) => {
    const matching = findVariantBySizeCrust(size, undefined);
    if (matching && matching.size !== variant.size) {
      const newCrust = parseCrustOptions(matching.crust)[0] || undefined;
      onChangeVariant(ruleIdx, slotIdx ?? 0, product._id, matching.sku, matching.size, newCrust);
    }
  };

  const handleCrustChange = (crust: string) => {
    if (crust === activeCrust) return;
    const matching = findVariantBySizeCrust(currentSize, crust);
    if (matching) {
      if (matching.sku !== variant.sku) {
        const newCrust = parseCrustOptions(matching.crust)[0] || undefined;
        onChangeVariant(ruleIdx, slotIdx ?? 0, product._id, matching.sku, matching.size, newCrust);
      } else {
        onChangeVariant(ruleIdx, slotIdx ?? 0, product._id, variant.sku, variant.size, crust);
      }
    } else {
      onChangeVariant(ruleIdx, slotIdx ?? 0, product._id, variant.sku, variant.size, crust);
    }
  };

  return (
    <div className="border border-orange-200 rounded-xl p-3 bg-orange-50/40">
      <div className="flex items-center gap-3">
        <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
          <Image src={variant.image.url} alt={product.name} fill className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
          <p className="text-xs text-muted-foreground">
            {variant.size}
            {isPizza && activeCrust ? ` - ${formatCrustLabel(activeCrust)}` : ""}
          </p>
        </div>
        {showReplace && onReplace && slotIdx !== undefined && (
          <button
            onClick={() => onReplace(ruleIdx, slotIdx)}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium underline cursor-pointer shrink-0"
          >
            Thay đổi
          </button>
        )}
      </div>

      {sizes.length > 1 && (
        <div className="flex items-center gap-1.5 mt-2">
          {sizes.map(size => {
            const isActive = size === currentSize;
            return (
              <button
                key={size}
                onClick={() => handleSizeChange(size)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-white border border-border text-muted-foreground hover:border-orange-300"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      )}

      {isPizza && crustsForSize.length > 1 && (
        <div className="flex items-center gap-1.5 mt-1.5">
          {crustsForSize.map(crust => {
            const isActive = crust === activeCrust;
            return (
              <button
                key={crust}
                onClick={() => handleCrustChange(crust)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-gray-800 text-white shadow-sm"
                    : "bg-white border border-border text-muted-foreground hover:border-gray-300"
                }`}
              >
                {formatCrustLabel(crust)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
