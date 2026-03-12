"use client";

import { getTemplateById } from "@/data/templates";
import { Separator } from "@/components/ui/separator";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { VariableControl } from "@/components/workspace/variable-control";

export function VariablePanel() {
  const selectedTemplateId = useWorkspaceStore((state) => state.selectedTemplateId);
  const variables = useWorkspaceStore((state) => state.variables);
  const setVariable = useWorkspaceStore((state) => state.setVariable);
  const template = getTemplateById(selectedTemplateId);

  if (!template) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{template.name}</h3>
        <p className="mt-1 text-sm text-text-secondary">{template.description}</p>
      </div>
      <Separator />
      <div className="space-y-3">
        {template.variables.map((variable) => (
          <VariableControl
            key={variable.id}
            variable={variable}
            value={variables[variable.id] ?? ""}
            onChange={(value) => setVariable(variable.id, value)}
          />
        ))}
      </div>
    </div>
  );
}
