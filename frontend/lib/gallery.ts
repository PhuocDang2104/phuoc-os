import type { AppId } from "./portfolio";

// One gallery item per CV project or selected research direction; SVGs are temporary illustrations.
export type GalleryItem = {
  id: string;
  title: string;
  category: string;
  art: "digit" | "field" | "chip" | "vision" | "notes" | "core" | "workspace";
  src?: string;
  action: { app: AppId } | { scene: true } | { href: string };
};
export const galleryItems: GalleryItem[] = [
  {
    id: "vnpt-meetmate",
    title: "Minute · Agentic AI",
    category: "PROJECT / 2025",
    art: "chip",
    src: "/portfolio/projects/vnpt-ai-banner.png",
    action: {
      href: "/work",
    },
  },
  {
    id: "fpt-iot",
    title: "S.C.E.N.T · Edge AIoT",
    category: "PROJECT / 2025",
    art: "chip",
    src: "/portfolio/projects/iot_challenge_banner.png",
    action: {
      href: "/work",
    },
  },
  {
    id: "pillars",
    title: "PILLARS · Remote Supervision",
    category: "PROJECT / 2026",
    art: "chip",
    src: "/portfolio/projects/pillars.svg",
    action: {
      href: "/work",
    },
  },
  {
    id: "greenflow",
    title: "GreenFlow · Digital Twin",
    category: "PROJECT / 2026",
    art: "chip",
    src: "/portfolio/projects/greenflow.svg",
    action: {
      href: "/work",
    },
  },
  {
    id: "aiming",
    title: "AIMING · Agricultural Vision",
    category: "PROJECT / 2025",
    art: "chip",
    src: "/portfolio/projects/intel_ai_banner.png",
    action: {
      href: "/work",
    },
  },
  {
    id: "savina",
    title: "SAVINA · HumanLog",
    category: "PROJECT / 2025",
    art: "chip",
    src: "/portfolio/projects/humanlog2025_banner.png",
    action: {
      href: "/work",
    },
  },
  {
    id: "xlstm-ranking",
    title: "xLSTM · Stock Selection",
    category: "COURSE PROJECT",
    art: "chip",
    src: "/portfolio/projects/xlstm.svg",
    action: {
      href: "/work",
    },
  },
  {
    id: "wrist-fall",
    title: "Wrist Fall Detection",
    category: "ACCEPTED PAPER / CSoNet 2026",
    art: "vision",
    src: "/portfolio/research/wrist-fall-overview.png",
    action: {
      href: "/research",
    },
  },
  {
    id: "depth-completion",
    title: "Depth Completion · JetODE",
    category: "IN PROGRESS",
    art: "vision",
    src: "/portfolio/research/depth-completion.svg",
    action: {
      href: "/research",
    },
  },
  {
    id: "mri-segmentation-diffusion",
    title: "MRI Segmentation & Diffusion",
    category: "RESEARCH DIRECTION",
    art: "vision",
    src: "/portfolio/research/mri-segmentation.svg",
    action: {
      href: "/research",
    },
  },
];
