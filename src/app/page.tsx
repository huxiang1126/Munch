"use client";

import { BottomBar } from "@/components/layout/bottom-bar";
import { TopBar } from "@/components/layout/top-bar";
import { TemplateDetailModal } from "@/components/creation/template-detail-modal";
import { VariableEditor } from "@/components/creation/variable-editor";
import { CategoryTabs } from "@/components/gallery/category-tabs";
import { MasonryGallery } from "@/components/gallery/masonry-gallery";
import { HeroSection } from "@/components/hero/hero-section";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <TopBar />
      <CategoryTabs />
      <main className="pb-28 pt-14">
        <HeroSection />
        <MasonryGallery />
      </main>
      <BottomBar />
      <TemplateDetailModal />
      <VariableEditor />
    </div>
  );
}
