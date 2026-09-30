// The single source of truth for personal content. Never invent missing credentials.
export const profile = {
  name: "Dang Nhu Phuoc",
  role: "AI & Embedded Engineer",
  location: "Ho Chi Minh City, Vietnam",
  timezone: "Asia/Ho_Chi_Minh",
  available: true,
  email: "phuoc.dang2104@gmail.com",
  github: "https://github.com/PhuocDang2104",
  linkedin: "https://www.linkedin.com/in/dangnhuphuoc/",
  resume: "/resume.pdf",
  bio: "I build intelligent systems across hardware, firmware, machine learning, and real-world deployment.",
  focus: ["Edge AI", "Computer Vision", "Embedded Systems"],
  research: ["Edge AI", "Computer Vision", "Explainable AI", "Intelligent sensing"],
};

export const sections = {
  work: {
    label: "Work",
    eyebrow: "SELECTED ENGINEERING",
    title: "From an idea to a working system.",
    description:
      "Projects at the intersection of machine learning, embedded hardware, and real-world deployment.",
    items: ["Edge AI & embedded intelligence", "Computer vision systems", "Hardware & firmware"],
    empty:
      "Project case studies are being prepared. Explore the AI Lab for a working experiment in the meantime.",
  },
  research: {
    label: "Research",
    eyebrow: "QUESTIONS WORTH ASKING",
    title: "Understanding the intelligence we build.",
    description:
      "Exploring efficient, explainable intelligence and how it can operate beyond the lab.",
    items: profile.research,
    empty: "Publication details, papers, and research artifacts will appear here once added.",
  },
  blog: {
    label: "Blog",
    eyebrow: "THE ENGINEERING NOTEBOOK",
    title: "Notes from the workbench.",
    description:
      "A home for build logs, technical deep dives, and lessons from bringing models to machines.",
    items: ["Engineering notes", "Research notes", "Build logs"],
    empty: "The notebook is open. The first entry is still being written.",
  },
  awards: {
    label: "Awards",
    eyebrow: "RECOGNITION & MILESTONES",
    title: "An archive of progress.",
    description: "Competition results, certifications, and the evidence behind each milestone.",
    items: ["Competitions", "Certifications", "Recognitions"],
    empty: "Verified awards and certificates have not been added yet.",
  },
} as const;

export type SectionId = keyof typeof sections;
export type AppId =
  | "about"
  | "snapshot"
  | "journey"
  | "current"
  | "gallery"
  | "resume"
  | "contact"
  | "quick"
  | "draw"
  | "research"
  | "stack"
  | "experiments"
  | "notes";
export type WorkspaceId = 0 | 1 | 2;

export const apps: Record<
  AppId,
  { label: string; file: string; icon: string; workspace: WorkspaceId }
> = {
  about: { label: "About me", file: "about.md", icon: "user", workspace: 0 },
  snapshot: { label: "Career snapshot", file: "career_snapshot.yml", icon: "scan", workspace: 0 },
  journey: { label: "Journey", file: "journey.log", icon: "route", workspace: 0 },
  current: { label: "Current work", file: "current_work.sh", icon: "terminal", workspace: 0 },
  gallery: { label: "Work gallery", file: "work/", icon: "folder", workspace: 0 },
  resume: { label: "Resume.pdf", file: "resume.pdf", icon: "file", workspace: 0 },
  contact: { label: "Contact", file: "contact.sh", icon: "mail", workspace: 0 },
  quick: { label: "Quick overview", file: "recruiter_view.md", icon: "scan", workspace: 0 },
  draw: { label: "Draw to navigate", file: "draw2navigate.ai", icon: "spark", workspace: 1 },
  research: { label: "Research", file: "research.md", icon: "network", workspace: 1 },
  stack: { label: "Tech stack", file: "stack.lock", icon: "layers", workspace: 1 },
  experiments: { label: "Experiments", file: "experiments/", icon: "flask", workspace: 1 },
  notes: { label: "Build notes", file: "notes.md", icon: "code", workspace: 1 },
};

export const workspaces = [
  { name: "Profile desk", label: "THE PERSON BEHIND THE SYSTEM", number: "01" },
  { name: "AI Lab", label: "A LITTLE CURIOSITY. REAL INFERENCE.", number: "02" },
  { name: "Neural core", label: "EVERYTHING IS CONNECTED", number: "03" },
] as const;
