import { fashionEditorial } from "@/data/templates/fashion-editorial";
import { fashionBluehourGrid } from "@/data/templates/fashion-bluehour-grid";
import { fashionGoldenhourGrid } from "@/data/templates/fashion-goldenhour-grid";
import { fashionRicefieldSpin } from "@/data/templates/fashion-ricefield-spin";
import { fashionStreet } from "@/data/templates/fashion-street";
import { foodLifestyle } from "@/data/templates/food-lifestyle";
import { foodOverhead } from "@/data/templates/food-overhead";
import { posterBrand } from "@/data/templates/poster-brand";
import { posterEvent } from "@/data/templates/poster-event";
import { posterTennisCampaign } from "@/data/templates/poster-tennis-campaign";
import { productLifestyle } from "@/data/templates/product-lifestyle";
import { productMinimal } from "@/data/templates/product-minimal";
import { skincareBeautyHeadshot } from "@/data/templates/skincare-beauty-headshot";
import { skincareLuxury } from "@/data/templates/skincare-luxury";
import { skincareNatural } from "@/data/templates/skincare-natural";

export const templates = [
  skincareLuxury,
  skincareNatural,
  skincareBeautyHeadshot,
  fashionEditorial,
  fashionStreet,
  fashionBluehourGrid,
  fashionGoldenhourGrid,
  fashionRicefieldSpin,
  foodOverhead,
  foodLifestyle,
  productMinimal,
  productLifestyle,
  posterEvent,
  posterBrand,
  posterTennisCampaign,
];

export function getTemplateById(templateId: string) {
  return templates.find((template) => template.id === templateId);
}
