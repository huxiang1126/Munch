"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { templates as staticTemplates } from "@/data/templates";
import { expandCompatibleModels, normalizeGenerationModel } from "@/lib/models";
import type { CanonicalImageModelId } from "@/lib/models";
import { staticTemplateToDb } from "@/lib/template-adapters";
import type { DbTemplate } from "@/types/database";
import type { GenerationModel } from "@/types/generation";

const fallbackTemplates = staticTemplates.map(staticTemplateToDb);
const defaultTemplate = fallbackTemplates[0];
const SUPPORTED_ASPECT_RATIOS = new Set(["16:9", "4:3", "1:1", "3:4", "9:16"]);

function sanitizeTemplate(template: DbTemplate): DbTemplate {
  const compatibleModels: CanonicalImageModelId[] = expandCompatibleModels(template.compatible_models, {
    hasImageInputs: template.variables.some((variable) => variable.type === "image"),
  }).filter((model, index, list) => list.indexOf(model) === index);
  const nextCompatibleModels: CanonicalImageModelId[] =
    compatibleModels.length > 0 ? compatibleModels : ["nano-banana-2-2k"];
  const defaultModel = normalizeGenerationModel(template.default_model, nextCompatibleModels[0]);

  return {
    ...template,
    default_model: defaultModel,
    compatible_models: nextCompatibleModels,
  };
}

function sanitizeTemplates(templates: DbTemplate[]) {
  const nextTemplates = templates.length > 0 ? templates : fallbackTemplates;
  return nextTemplates.map(sanitizeTemplate);
}

function getTemplateFromList(templateId: string, templateList: DbTemplate[]) {
  return templateList.find((item) => item.id === templateId) ?? defaultTemplate;
}

function sanitizeVariablesForTemplate(
  variables: Record<string, string> | undefined,
  templateList = fallbackTemplates,
  templateId = defaultTemplate.id,
) {
  const template = getTemplateFromList(templateId, templateList);
  const input = variables ?? {};

  return Object.fromEntries(
    template.variables.map((variable) => {
      const candidate = input[variable.id];

      if (variable.type === "image") {
        return [variable.id, ""];
      }

      if (variable.type === "slider") {
        if (!candidate) {
          return [variable.id, String(variable.defaultNumber ?? variable.min ?? 0)];
        }

        const numeric = Number(candidate);
        const fallback = variable.defaultNumber ?? variable.min ?? 0;

        if (!Number.isFinite(numeric)) {
          return [variable.id, String(fallback)];
        }

        const min = variable.min ?? numeric;
        const max = variable.max ?? numeric;
        const clamped = Math.min(Math.max(numeric, min), max);
        return [variable.id, String(clamped)];
      }

      if (variable.type === "select") {
        const allowed = new Set((variable.options ?? []).map((option) => option.value));
        if (candidate && allowed.has(candidate)) {
          return [variable.id, candidate];
        }

        return [variable.id, variable.defaultValue ?? ""];
      }

      return [variable.id, candidate ?? variable.defaultValue ?? String(variable.defaultNumber ?? "")];
    }),
  );
}

function getDefaultVariables(templateList = fallbackTemplates, templateId = defaultTemplate.id) {
  return sanitizeVariablesForTemplate(undefined, templateList, templateId);
}

function getTemplateState(templateId: string, templateList = fallbackTemplates) {
  const template = getTemplateFromList(templateId, templateList);

  return {
    selectedTemplateId: template.id,
    selectedModel: normalizeGenerationModel(template.default_model),
    variables: getDefaultVariables(templateList, template.id),
  };
}

interface WorkspaceState {
  templates: DbTemplate[];
  selectedTemplateId: string;
  selectedModel: GenerationModel;
  imageCount: 1 | 2 | 3 | 4;
  freePrompt: string;
  thinkingEnabled: boolean;
  freeImageFiles: Record<string, File>;
  variables: Record<string, string>;
  customPrompt: string;
  imageFiles: Record<string, File>;
  creationMode: "image" | "video";
  orientation: "landscape" | "portrait";
  aspectRatio: string;
  activeModal: null | "template-detail" | "variable-editor";
  viewingTemplateId: string | null;
  activeCategoryFilter: string | null;
  setTemplates: (templates: DbTemplate[]) => void;
  selectTemplate: (templateId: string) => void;
  setFreePrompt: (value: string) => void;
  setThinkingEnabled: (value: boolean) => void;
  addFreeImageFiles: (files: File[]) => void;
  removeFreeImageFile: (imageId: string) => void;
  clearFreeImageFiles: () => void;
  setVariable: (variableId: string, value: string) => void;
  setCustomPrompt: (value: string) => void;
  setImageFile: (variableId: string, file: File | null) => void;
  clearImageFiles: () => void;
  setModel: (model: GenerationModel) => void;
  setImageCount: (count: 1 | 2 | 3 | 4) => void;
  setCreationMode: (mode: "image" | "video") => void;
  setOrientation: (orientation: "landscape" | "portrait") => void;
  setAspectRatio: (ratio: string) => void;
  openTemplateDetail: (templateId: string) => void;
  openVariableEditor: () => void;
  closeModal: () => void;
  setCategoryFilter: (category: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      templates: sanitizeTemplates(fallbackTemplates),
      selectedTemplateId: defaultTemplate.id,
      selectedModel: normalizeGenerationModel(defaultTemplate.default_model),
      imageCount: 2,
      freePrompt: "",
      thinkingEnabled: false,
      freeImageFiles: {},
      variables: getDefaultVariables(),
      customPrompt: "",
      imageFiles: {},
      creationMode: "image",
      orientation: "landscape",
      aspectRatio: "1:1",
      activeModal: null,
      viewingTemplateId: null,
      activeCategoryFilter: null,
      setTemplates: (templates) =>
        set((state) => {
          const nextTemplates = sanitizeTemplates(templates);
          const selectedTemplate = nextTemplates.find((item) => item.id === state.selectedTemplateId);
          const activeCategoryFilter =
            state.activeCategoryFilter &&
            nextTemplates.some((template) => template.category === state.activeCategoryFilter)
              ? state.activeCategoryFilter
              : null;

          if (!selectedTemplate) {
            return {
              templates: nextTemplates,
              activeCategoryFilter,
              freePrompt: state.freePrompt,
              thinkingEnabled: state.thinkingEnabled,
              freeImageFiles: state.freeImageFiles,
              customPrompt: "",
              ...getTemplateState(nextTemplates[0]?.id ?? defaultTemplate.id, nextTemplates),
            };
          }

          return {
            templates: nextTemplates,
            activeCategoryFilter,
          };
        }),
      selectTemplate: (templateId) => {
        set((state) => {
          const nextTemplate = state.templates.find((template) => template.id === templateId);
          if (!nextTemplate) {
            return state;
          }

          return {
            ...state,
            ...getTemplateState(nextTemplate.id, state.templates),
            customPrompt: "",
            imageFiles: {},
          };
        });
      },
      setFreePrompt: (freePrompt) => set({ freePrompt }),
      setThinkingEnabled: (thinkingEnabled) => set({ thinkingEnabled }),
      addFreeImageFiles: (files) =>
        set((state) => {
          const next = { ...state.freeImageFiles };
          const slotsLeft = Math.max(0, 4 - Object.keys(next).length);
          files.slice(0, slotsLeft).forEach((file) => {
            next[globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`] = file;
          });
          return { freeImageFiles: next };
        }),
      removeFreeImageFile: (imageId) =>
        set((state) => {
          const next = { ...state.freeImageFiles };
          delete next[imageId];
          return { freeImageFiles: next };
        }),
      clearFreeImageFiles: () => set({ freeImageFiles: {} }),
      setVariable: (variableId, value) =>
        set((state) => ({
          variables: {
            ...state.variables,
            [variableId]: value,
          },
        })),
      setCustomPrompt: (customPrompt) => set({ customPrompt }),
      setImageFile: (variableId, file) =>
        set((state) => {
          const next = { ...state.imageFiles };
          if (file) {
            next[variableId] = file;
          } else {
            delete next[variableId];
          }
          return { imageFiles: next };
        }),
      clearImageFiles: () => set({ imageFiles: {} }),
      setModel: (model) => set({ selectedModel: normalizeGenerationModel(model) }),
      setImageCount: (count) => set({ imageCount: count }),
      setCreationMode: (creationMode) => set({ creationMode }),
      setOrientation: (orientation) => set({ orientation }),
      setAspectRatio: (aspectRatio) => set({ aspectRatio }),
      openTemplateDetail: (templateId) =>
        set({
          viewingTemplateId: templateId,
          activeModal: "template-detail",
        }),
      openVariableEditor: () =>
        set((state) => {
          if (!state.viewingTemplateId) {
            return state;
          }

          return {
            ...state,
            ...getTemplateState(state.viewingTemplateId, state.templates),
            customPrompt:
              state.viewingTemplateId === state.selectedTemplateId ? state.customPrompt : "",
            activeModal: "variable-editor" as const,
          };
        }),
      closeModal: () =>
        set({
          activeModal: null,
          viewingTemplateId: null,
        }),
      setCategoryFilter: (activeCategoryFilter) => set({ activeCategoryFilter }),
    }),
    {
      name: "munch-workspace",
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { imageFiles, ...rest } = state;
        return rest;
      },
      merge: (persistedState, currentState) => {
        const typedState = persistedState as Partial<WorkspaceState> | undefined;
        const templates = sanitizeTemplates(typedState?.templates ?? currentState.templates);
        const selectedTemplateId =
          typedState?.selectedTemplateId &&
          templates.some((template) => template.id === typedState.selectedTemplateId)
            ? typedState.selectedTemplateId
            : templates[0]?.id ?? currentState.selectedTemplateId;
        const selectedTemplate =
          templates.find((template) => template.id === selectedTemplateId) ?? templates[0] ?? defaultTemplate;

          return {
            ...currentState,
            ...typedState,
          templates,
          selectedTemplateId,
          activeCategoryFilter:
            typedState?.activeCategoryFilter &&
            templates.some((template) => template.category === typedState.activeCategoryFilter)
              ? typedState.activeCategoryFilter
              : null,
          freePrompt: typedState?.freePrompt ?? "",
          thinkingEnabled: typedState?.thinkingEnabled ?? false,
          selectedModel: normalizeGenerationModel(
            typedState?.selectedModel,
            normalizeGenerationModel(selectedTemplate.default_model),
          ),
          customPrompt: typedState?.customPrompt ?? "",
          freeImageFiles: {},
          imageFiles: {},
          aspectRatio:
            typedState?.aspectRatio && SUPPORTED_ASPECT_RATIOS.has(typedState.aspectRatio)
              ? typedState.aspectRatio
              : "1:1",
          variables: sanitizeVariablesForTemplate(
            typedState?.variables,
            templates,
            selectedTemplateId,
          ),
        };
      },
    },
  ),
);
