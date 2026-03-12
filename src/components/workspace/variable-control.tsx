"use client";

import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TemplateVariable } from "@/types/template";

interface VariableControlProps {
  variable: TemplateVariable;
  value: string;
  onChange: (value: string) => void;
}

export function VariableControl({ variable, value, onChange }: VariableControlProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-black/10 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-primary">{variable.name}</p>
          <p className="text-xs text-text-tertiary">
            {variable.required ? "必选变量" : "可选变量"}
          </p>
        </div>
        {variable.type === "slider" ? (
          <span className="text-xs text-text-secondary">
            {value}
            {variable.unit}
          </span>
        ) : null}
      </div>
      {variable.type === "select" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="border-border/70 bg-bg-hover">
            <SelectValue placeholder="选择一个变量值" />
          </SelectTrigger>
          <SelectContent className="border-border bg-bg-overlay">
            {(variable.options ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description ? (
                    <span className="text-xs text-text-tertiary">{option.description}</span>
                  ) : null}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className={cn("space-y-3")}>
          <Slider
            min={variable.min}
            max={variable.max}
            step={variable.step}
            value={[Number(value)]}
            onValueChange={([nextValue]) => onChange(String(nextValue))}
          />
        </div>
      )}
    </div>
  );
}
