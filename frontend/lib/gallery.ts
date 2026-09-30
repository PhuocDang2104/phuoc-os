import type { AppId, WorkspaceId } from "./portfolio";

// Verified project media sits alongside artwork for this site's live experiments.
export type GalleryItem = {
  id: string;
  title: string;
  category: string;
  art: "digit" | "field" | "chip" | "vision" | "notes" | "core" | "workspace";
  src?: string;
  action: { app: AppId } | { workspace: WorkspaceId } | { href: string };
};
export const galleryItems: GalleryItem[] = [
  { id: "vnpt", title: "SAVINAI MeetMate", category: "AI SYSTEMS / 2025", art: "vision", src: "/portfolio/projects/vnpt-ai-banner.png", action: { href: "/work" } },
  { id: "fpt", title: "FPT IoT Challenge", category: "AIoT / 2025", art: "chip", src: "/portfolio/projects/iot_challenge_banner.png", action: { href: "/work" } },
  { id: "humanlog", title: "SAVINA · HumanLog", category: "SOCIAL IMPACT / 2025", art: "field", src: "/portfolio/projects/humanlog2025_banner.png", action: { href: "/social" } },
  { id: "fall", title: "Wrist fall detection", category: "PAPER / RESEARCH", art: "vision", src: "/portfolio/research/wrist-fall-overview.png", action: { href: "/research" } },
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
