"use client";
import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Filter, Pizza, Eye, EyeOff, Tag, Percent } from "lucide-react";
import { useEmployeeAuth } from "@/src/context/authEmployeeContext";
import Image from "next/image";
import { addProduct, getAllProducts } from "@/src/services/product.service";
import { getAllCategories } from "@/src/services/category.service";
import { ImageInput } from "@/src/components/ui/input";
import { getAllIngredients } from "@/src/services/ingredient.service";
import { toast, Toaster } from "sonner";

interface IngredientList {
  _id: string;
  name: string;
  unit: string;
  category: string;
  is_active: boolean;
  isDeleted: boolean;
}
export interface RecipeItemPayload {
  ingredient_id: string;
  quantity: number;
  unit: string;
}

export interface VariantPayload {
  sku: string;
  size: string;
  price: number;
  recipe: RecipeItemPayload[];
  imageFile: File;
}

export interface AddProductPayload {
  name: string;
  category: string;
  description: string;
  variants: VariantPayload[];
}

type MenuCategoryUI = {
  _id: string;
  slug: string;
  name: string;
  icon: string;
};

export type ProductCategory = {
  _id: string;
  name: string;
  slug: string;
};

export type ProductImage = {
  _id: string;
  url: string;
  public_id: string;
};

export type Ingredient = {
  _id: string;
  name: string;
};

export type RecipeIngredient = {
  ingredient: Ingredient;
  quantity: number;
  unit: string;
};

export type ProductVariant = {
  sku: string;
  price: number;
  size: string;
  image: ProductImage;
  recipe: RecipeIngredient[];
};

type Product = {
  _id: string;
  category: ProductCategory;
  name: string;
  description: string;
  is_active: boolean;
  variants: ProductVariant[];
  isDeleted: boolean;
};

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export default function Products() {
  const { user } = useEmployeeAuth();
  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<MenuCategoryUI[]>([]);
  const [ingredients, setIngredients] = useState<IngredientList[]>();
  const [isLoading, setIsLoading] = useState(false);

  const [basicInfo, setBasicInfo] = useState({
    name: "",
    category: "",
    description: "",
  });

  const [variantsFrom, setVariantsFrom] = useState<VariantPayload[]>([
    {
      sku: "",
      size: "",
      price: 0,
      imageFile: undefined as any,
      recipe: [],
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    let isValidate = true;

    const missingImage = variantsFrom.some(v => !v.imageFile);
    if (missingImage) {
      toast.warning("Vui lòng chọn đầy đủ ảnh cho từng size!");
      isValidate = false;
      setIsLoading(false);
      return;
    }
    const formatForSku = (str: string) => str.toUpperCase().trim().replace(/\s+/g, "-");
    try {
      const payload: AddProductPayload = {
        name: basicInfo.name,
        category: basicInfo.category,
        description: basicInfo.description,
        variants: variantsFrom.map(v => {
          if (v.size === "" || v.price === 0) {
            toast.warning("Vui lòng nhập đầy đủ size và giá!");
            isValidate = false;
          }
          if (v.recipe.length === 0) {
            toast.warning("Vui lòng thêm công thức cho sản phẩm!");
            isValidate = false;
          }

          const newSku = `${formatForSku(categories?.find(item => item._id === basicInfo.category)?.name.charAt(0) || "")}-${formatForSku(basicInfo.name)}-${formatForSku(v.size)}`;
          return { sku: newSku, size: v.size, price: v.price, recipe: v.recipe, imageFile: v.imageFile as File };
        }),
      };

      if (!isValidate) {
        setIsLoading(false);
        return;
      }
      const result = await addProduct(payload);

      if (result) {
        toast.success("Thêm sản phẩm thành công");
        setShowModal(false);
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Lỗi khi thêm sản phẩm:", error);
      toast.error(`Tạo thất bại: ${error.message || "Có lỗi xảy ra"}`);
    }
  };

  useEffect(() => {
    const fectData = async () => {
      try {
        const ListProduct = await getAllProducts();
        const ListCategory = await getAllCategories();
        const ListIngredients = await getAllIngredients();
        const mappedCategories: MenuCategoryUI[] = ListCategory.filter(cat => cat.is_active && !cat.isDeleted).map(cat => ({
          _id: cat._id,
          slug: cat.slug,
          name: cat.name,
          icon: cat.icon,
        }));

        const finalCategories: MenuCategoryUI[] = [
          {
            _id: "all",
            slug: "all",
            name: "Tất cả",
            icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXV0ZW5zaWxzLWNyb3NzZWQtaWNvbiBsdWNpZGUtdXRlbnNpbHMtY3Jvc3NlZCI+PHBhdGggZD0ibTE2IDItMi4zIDIuM2EzIDMgMCAwIDAgMCA0LjJsMS44IDEuOGEzIDMgMCAwIDAgNC4yIDBMMjIgOCIvPjxwYXRoIGQ9Ik0xNSAxNSAzLjMgMy4zYTQuMiA0LjIgMCAwIDAgMCA2bDcuMyA3LjNjLjcuNyAyIC43IDIuOCAwTDE1IDE1Wm0wIDAgNyA3Ii8+PHBhdGggZD0ibTIuMSAyMS44IDYuNC02LjMiLz48cGF0aCBkPSJtMTkgNS03IDciLz48L3N2Zz4=",
          },
          ...mappedCategories,
        ];
        setProducts(ListProduct);
        setCategories(finalCategories);
        setIngredients(ListIngredients);
      } catch (error) {
        return error;
      }
    };
    fectData();
  }, [isLoading]);

  const filtered = products.filter(
    p => (categoryFilter === "all" || p.category.slug === categoryFilter) && p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleStatus = (id: string) => {
    //setProducts(prev => prev.map(p => (p.id === id ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p)));
  };

  const openCreate = () => {
    setEditItem(null);
    setShowModal(true);
    setBasicInfo({ name: "", category: categories[1]._id, description: "" });
  };

  const openEdit = (product: Product) => {
    setEditItem(product);
    setShowModal(true);
  };

  const addSize = () => {
    const newVariant = {
      sku: "",
      size: "",
      price: 0,
      imageFile: undefined as any,
      recipe: [],
    };
    setVariantsFrom([...variantsFrom, newVariant]);
  };

  const removeSize = (indexToRemove: number) => {
    const updatedVariants = variantsFrom.filter((_, index) => index !== indexToRemove);
    setVariantsFrom(updatedVariants);
  };

  const addIngredientToSize = (variantIndex: number) => {
    setVariantsFrom(prevVariants =>
      prevVariants.map((variant, index) => {
        if (index === variantIndex) {
          return {
            ...variant,
            recipe: [
              ...variant.recipe,
              { ingredient_id: ingredients[0]?._id || "", quantity: 0, unit: ingredients[0]?.unit || "" },
            ],
          };
        }
        return variant;
      }),
    );
  };

  const removeIngredientToSize = (variantIndex: number, ingredientIndex: number) => {
    setVariantsFrom(prevVariants =>
      prevVariants.map((variant, index) => {
        if (index === variantIndex) {
          return {
            ...variant,
            recipe: variant.recipe.filter((_, i) => i !== ingredientIndex),
          };
        }

        return variant;
      }),
    );
  };

  const handleVariantChange = (index: number, field: keyof VariantPayload, value: string | number | File | null | any[]) => {
    setVariantsFrom(prevVariants => {
      return prevVariants.map((variant, i) => {
        if (i === index) {
          return { ...variant, [field]: value };
        }
        return variant;
      });
    });
  };

  const handleRecipeChange = (
    variantIndex: number,
    ingredientIndex: number,
    field: keyof RecipeItemPayload,
    value: string | number,
  ) => {
    setVariantsFrom(prevVariants =>
      prevVariants.map((variant, vIndex) => {
        if (vIndex === variantIndex) {
          const updatedRecipe = variant.recipe.map((ingredient, iIndex) => {
            if (iIndex === ingredientIndex) {
              return { ...ingredient, [field]: value };
            }
            return ingredient;
          });

          return { ...variant, recipe: updatedRecipe };
        }

        return variant;
      }),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">Quản lý sản phẩm</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? "Tạo và quản lý danh sách sản phẩm hệ thống" : "Ẩn/hiện sản phẩm trên menu cửa hàng"}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            <Plus size={18} /> Thêm sản phẩm
          </button>
        )}
        {!isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            <Eye size={18} /> Hiện sản phẩm
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3">
          <Filter size={16} className="text-muted-foreground" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-transparent py-2.5 text-sm outline-none text-foreground"
          >
            {categories.map(c => (
              <option key={c.slug} value={c.slug}>
                {c.slug === "all" ? "Tất cả danh mục" : c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(product => (
          <div
            key={product._id}
            className={`bg-card rounded-2xl border overflow-hidden hover:shadow-lg transition-shadow group ${!product.is_active ? "border-border opacity-60" : "border-border"}`}
          >
            <div className="h-40 bg-muted relative overflow-hidden">
              {product.variants[0].image.url ? (
                <Image
                  src={product.variants[0].image.url}
                  alt={product.name}
                  fill
                  loading="eager"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Pizza size={40} className="text-muted-foreground/30" />
                </div>
              )}
              <span
                className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] ${product.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
              >
                {product.is_active ? "Đang bán" : "Đã ẩn"}
              </span>
              {/* {product.discount > 0 && (
                <span className="absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] bg-red-500 text-white flex items-center gap-0.5">
                  <Percent size={10} /> -{product.discount}%
                </span>
              )} */}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-foreground">{product.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{product.category.name}</p>
                </div>
                <div className="text-right shrink-0">
                  {/* {product.discount > 0 ? (
                    <div>
                      <span className="text-xs text-muted-foreground line-through">{formatVND(product.price)}</span>
                      <p className="text-primary">{formatVND(Math.round(product.price * (1 - product.discount / 100)))}</p>
                    </div>
                  ) : (
                    <span className="text-primary">{formatVND(product.price)}</span>
                  )} */}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{product.description}</p>

              {/* {isAdmin && product.recipe.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {product.recipe.slice(0, 3).map((r, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-orange-50 text-orange-600">
                      {r.name}
                    </span>
                  ))}
                  {product.recipe.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-muted text-muted-foreground">
                      +{product.recipe.length - 3}
                    </span>
                  )}
                </div>
              )} */}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <button
                  onClick={() => toggleStatus(product._id)}
                  className={`flex-1 flex items-center justify-center gap-1 text-sm py-2 rounded-lg transition-colors ${product.is_active === true ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                >
                  {product.is_active ? (
                    <>
                      <EyeOff size={14} /> Ẩn
                    </>
                  ) : (
                    <>
                      <Eye size={14} /> Hiện
                    </>
                  )}
                </button>

                {isAdmin && (
                  <button
                    onClick={() => openEdit(product)}
                    className="flex items-center justify-center gap-1 text-sm py-2 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Edit2 size={14} /> Sửa
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && isAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0!"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-card rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-foreground mb-4">{editItem ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Tên sản phẩm *</label>
                  <input
                    defaultValue={editItem?.name}
                    value={basicInfo.name}
                    onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })}
                    placeholder="VD: Pizza Pepperoni"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Danh mục *</label>
                  <select
                    defaultValue={categories[0]._id || editItem?.category.slug}
                    onChange={e => setBasicInfo({ ...basicInfo, category: e.target.value })}
                    value={basicInfo.category}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  >
                    {categories.map(item =>
                      item.slug === "all" ? (
                        <></>
                      ) : (
                        <>
                          <option key={item.slug} value={item._id}>
                            {item.name}
                          </option>
                        </>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Mô tả</label>
                <textarea
                  defaultValue={editItem?.description || ""}
                  value={basicInfo.description}
                  onChange={e => setBasicInfo({ ...basicInfo, description: e.target.value })}
                  rows={2}
                  placeholder="Mô tả sản phẩm..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm">Size</label>
                  <button
                    type="button"
                    onClick={() => addSize()}
                    className="flex items-center gap-1 text-primary text-sm hover:underline cursor-pointer"
                  >
                    <Plus size={14} /> Thêm size
                  </button>
                </div>

                {variantsFrom.length === 0 ? (
                  <div className="bg-muted/50 rounded-xl p-4 text-center text-sm text-muted-foreground">
                    {`Chưa có size nào cho sản phẩm này.`}
                  </div>
                ) : (
                  <div className="space-y-2 ">
                    {variantsFrom.map((variant, i) => (
                      <div key={i} className="flex flex-col gap-2 bg-muted/30 rounded-xl p-3 ">
                        <div className="flex justify-between gap-2 ">
                          <div className="flex gap-2">
                            <ImageInput
                              accept="image/*"
                              className="h-20 w-20"
                              required
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleVariantChange(i, "imageFile", file);
                                }
                              }}
                            />
                            <div>
                              <label className="block col-span-2 text-xs mb-1">Size *</label>
                              <input
                                type="text"
                                value={variant.size}
                                onChange={e => handleVariantChange(i, "size", e.target.value)}
                                placeholder="Size"
                                className="w-30 px-3 py-2 rounded-lg border border-border bg-background outline-none text-sm text-center"
                              />
                            </div>
                            <div>
                              <label className="block col-span-2 text-xs mb-1">Giá bán (đ) *</label>
                              <input
                                type="number"
                                value={variant.price}
                                onChange={e => handleVariantChange(i, "price", e.target.value)}
                                placeholder="170000"
                                className="w-45 px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="flex items-center gap-1 text-primary text-sm hover:underline cursor-pointer"
                              onClick={() => addIngredientToSize(i)}
                            >
                              <Plus size={14} /> Thêm nguyên liệu
                            </button>
                            <button
                              onClick={() => removeSize(i)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors text-sm cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          {variant.recipe.map((ingredient, ingredientIndex) => (
                            <div key={ingredientIndex} className="flex items-center py-1 text-sm">
                              Nguyên liệu {ingredientIndex + 1}:
                              <select
                                value={ingredient.ingredient_id}
                                defaultValue={ingredients[0]?._id || ""}
                                onChange={e => {
                                  const newIngredientId = e.target.value;
                                  const selectedIngredient = ingredients?.find(item => item._id === newIngredientId);
                                  handleRecipeChange(i, ingredientIndex, "ingredient_id", selectedIngredient?._id || "");
                                  handleRecipeChange(i, ingredientIndex, "unit", selectedIngredient?.unit || "");
                                }}
                                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background outline-none text-sm mx-1"
                              >
                                {ingredients?.map(ing => (
                                  <option key={ing._id} value={ing._id || ""}>
                                    {ing.name}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={ingredient.quantity}
                                onChange={e => handleRecipeChange(i, ingredientIndex, "quantity", e.target.value)}
                                placeholder="Trọng lượng"
                                required
                                min={1}
                                className="w-35 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:border-primary outline-none mr-1"
                              />
                              <input
                                type="text"
                                value={ingredient.unit}
                                placeholder="Đơn vị tính"
                                readOnly
                                className="w-25 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:border-primary outline-none"
                              />
                              <button
                                onClick={() => removeIngredientToSize(i, ingredientIndex)}
                                className=" p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors text-sm cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
                >
                  Hủy
                </button>
                {isLoading ? (
                  <button
                    onClick={e => handleSubmit(e)}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white bg-primary/50 transition-colors"
                    disabled
                  >
                    Đang thêm vào cơ sở dữ liệu...
                  </button>
                ) : (
                  <button
                    onClick={e => handleSubmit(e)}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    {editItem ? "Cập nhật" : "Thêm mới"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* {showModal && !isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div
            className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-foreground mb-2">Thêm sản phẩm vào menu</h3>
            <p className="text-sm text-muted-foreground mb-4">Chọn từ danh sách sản phẩm đã được Admin tạo</p>
            <div className="space-y-2">
              {products.filter(p => p.is_active === true).length === 0 ? (
                <div className="bg-muted/50 rounded-xl p-6 text-center text-sm text-muted-foreground">
                  Tất cả sản phẩm đã được hiển thị
                </div>
              ) : (
                products
                  .filter(p => p.is_active === true)
                  .map(product => (
                    <div
                      key={product._id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                        {product.variants[0].image.url ? (
                          <Image
                            src={product.variants[0].image.url}
                            alt={product.name}
                            fill
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Pizza size={20} className="text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.category.name} • {formatVND(product.variants[0].price)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          toggleStatus(product._id);
                        }}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20 transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  ))
              )}
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )} */}
      <Toaster
        toastOptions={{
          classNames: {
            success: "bg-green-500! text-white! border-green-600!",
            error: "bg-red-500! text-white! border-red-600!",
            warning: "bg-yellow-500! text-white! border-yellow-600!",
            toast: "bg-gray-800! text-white!",
          },
        }}
      />
    </div>
  );
}
