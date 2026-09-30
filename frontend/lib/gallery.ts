import type { AppId, WorkspaceId } from "./portfolio";

// Replace preview art with image paths here when real project media is available.
// These entries describe working site experiments and research areas, not invented case studies.
export type GalleryItem = {
  id: string;
  title: string;
  category: string;
  art: "digit" | "field" | "chip" | "vision" | "notes" | "core" | "workspace";
  action: { app: AppId } | { workspace: WorkspaceId } | { href: string };
};
export const galleryItems: GalleryItem[] = [
  {
    id: "draw",
    title: "A handwritten shortcut",
    category: "LIVE EXPERIMENT",
    art: "digit",
    action: { app: "draw" },
  },
  {
    id: "field",
    title: "Computational landscapes",
    category: "LIVE EXPERIMENT",
    art: "field",
    action: { workspace: 2 },
  },
  {
    id: "edge",
    title: "Intelligence at the edge",
    category: "WORK DIRECTORY",
    art: "chip",
    action: { href: "/work" },
  },
  {
    id: "vision",
    title: "Learning to see",
    category: "RESEARCH AREA",
    art: "vision",
    action: { href: "/research" },
  },
  {
    id: "notes",
    title: "From the workbench",
    category: "BUILD NOTES",
    art: "notes",
    action: { app: "notes" },
  },
  {
    id: "core",
    title: "A map of ideas",
    category: "INTERACTIVE SCENE",
    art: "core",
    action: { workspace: 2 },
  },
  {
    id: "os",
    title: "The personal workstation",
    category: "LIVE EXPERIENCE",
    art: "workspace",
    action: { app: "about" },
  },
];
