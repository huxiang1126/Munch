import type { TemplateCategory } from "@/types/template";

export const templateCategoryOptions = [
  { value: "skincare", label: "护肤美容" },
  { value: "fashion", label: "服装穿搭" },
  { value: "portrait", label: "时尚写真" },
  { value: "food", label: "食品饮品" },
  { value: "product", label: "通用产品" },
  { value: "poster", label: "海报广告" },
] as const satisfies ReadonlyArray<{
  value: TemplateCategory;
  label: string;
}>;

export const templateCategoryLabels = Object.fromEntries(
  templateCategoryOptions.map((option) => [option.value, option.label]),
) as Record<TemplateCategory, string>;
