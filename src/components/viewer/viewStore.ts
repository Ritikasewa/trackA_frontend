import { create } from "zustand";
export type ViewPreset = "front" | "patientLeft" | "patientRight" | "back";
export const PRESETS: Record<ViewPreset, [number, number, number]> = { front: [0.12, 0.35, 8.4], patientLeft: [8.4, 0.35, 0.0], patientRight: [-8.4, 0.35, 0.0], back: [0.12, 0.35, -8.4] };
export type HeartModel = "anatomical" | "schematic";
export const useView = create<{ preset: ViewPreset; nonce: number; model: HeartModel; set: (p: ViewPreset) => void; setModel: (m: HeartModel) => void }>()((set) => ({ preset: "front", nonce: 0, model: "anatomical", set: (preset) => set((s) => ({ preset, nonce: s.nonce + 1 })), setModel: (model) => set({ model }) }));
