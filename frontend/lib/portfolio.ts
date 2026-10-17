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
  portrait: "/portrait-github.png",
  bio: "I build intelligent systems across hardware, firmware, machine learning, and real-world deployment.",
  focus: ["Edge AI", "Computer Vision", "Embedded Systems"],
  research: [
    "Explainable wrist-based fall detection",
    "Depth completion",
    "MRI segmentation & diffusion",
  ],
};

// Listed in the primary CV; individual certificate files can be linked here later.
export const certifications = [
  "IELTS 6.5",
  "Udemy · Advanced Python / C / C++",
  "Udemy · PyTorch for Deep Learning Bootcamp",
  "Udemy · Full Stack Generative and Agentic AI",
];

export const sections = {
  work: {
    label: "Work",
    eyebrow: "SELECTED ENGINEERING",
    title: "From an idea to a working system.",
    description:
      "Projects at the intersection of machine learning, embedded hardware, and real-world deployment.",
    items: ["Edge AI & embedded intelligence", "Computer vision systems", "Hardware & firmware"],
    empty:
      "Project case studies are being prepared. Try NAV.AI on Home for a working experiment in the meantime.",
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
  social: {
    label: "Social",
    eyebrow: "COMMUNITY & IMPACT",
    title: "Beyond the build.",
    description: "Community-minded engineering, charity and club activity.",
    items: ["Humanitarian technology", "Charity", "Clubs"],
    empty: "More community activities will be added with photos and dates.",
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
  | "gallery"
  | "resume"
  | "contact"
  | "certifications"
  | "draw"
  | "research"
  | "stack"
  | "experiments"
  | "notes";

export const apps: Record<AppId, { label: string; file: string; icon: string }> = {
  about: { label: "About me", file: "about.md", icon: "user" },
  snapshot: { label: "Career snapshot", file: "career_snapshot.yml", icon: "scan" },
  journey: { label: "Journey", file: "journey.log", icon: "route" },
  gallery: { label: "Work gallery", file: "work/", icon: "folder" },
  resume: { label: "Resume.pdf", file: "resume.pdf", icon: "file" },
  contact: { label: "Contact", file: "contact.sh", icon: "mail" },
  certifications: { label: "Certifications", file: "certifications/", icon: "award" },
  draw: { label: "Draw to navigate", file: "draw2navigate.ai", icon: "spark" },
  research: { label: "Research", file: "research.md", icon: "network" },
  stack: { label: "Tech stack", file: "stack.lock", icon: "layers" },
  experiments: { label: "Experiments", file: "experiments/", icon: "flask" },
  notes: { label: "Build notes", file: "notes.md", icon: "code" },
};
