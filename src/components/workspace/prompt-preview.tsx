"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useGenerationStore } from "@/stores/generation-store";

export function PromptPreview() {
  const compiledPrompt = useGenerationStore((state) => state.compiledPrompt);

  if (!compiledPrompt) {
    return null;
  }

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="compiled-prompt" className="rounded-2xl border border-border/70 px-4">
        <AccordionTrigger className="text-sm text-text-primary">查看编译后的 Prompt</AccordionTrigger>
        <AccordionContent className="font-mono text-xs leading-6 text-text-secondary">
          {compiledPrompt}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
