export type EditorialArea = "work" | "research";
export type EditorialEntry = {
  id: string;
  area: EditorialArea;
  category: string;
  kind: string;
  title: string;
  summary: string;
  tags: string[];
  thumbnail?: string;
  document?: { label: string; href: string };
  sections: { heading: string; text: string }[];
};

// Project media and documents are migrated from the owner's previous portfolio and paper folder.
export const entries: EditorialEntry[] = [
  {
    id: "vnpt-meetmate", area: "work", category: "AI systems", kind: "SELECTED PROJECT",
    title: "SAVINAI MeetMate · VNPT AI Hackathon 2025",
    summary: "A meeting intelligence system using speech and agent workflows, built for the VNPT AI Hackathon. Top 3 among more than 200 teams.",
    thumbnail: "/portfolio/projects/vnpt-ai-banner.png", tags: ["Speech AI", "LangGraph", "Cloud"],
    sections: [
      { heading: "Problem", text: "Meeting decisions and action items are easy to lose across recordings and notes. MeetMate was built around the full meeting lifecycle, from speech to useful follow-up." },
      { heading: "System", text: "The team integrated a low-latency LangGraph pipeline with VNPT APIs and cloud services to produce recaps and structured meeting outputs. The original project archive documents the architecture and deployment." },
      { heading: "Recognition", text: "The project received 2nd Runner-up at VNPT AI Hackathon 2025. The certificate is available on the Awards wall." },
    ],
  },
  {
    id: "fpt-iot", area: "work", category: "Embedded & IoT", kind: "SELECTED PROJECT",
    title: "FPT IoT Challenge · connected intelligence",
    summary: "An end-to-end AIoT solution delivered under competition constraints; Top 2 among 140 teams.",
    thumbnail: "/portfolio/projects/iot_challenge_banner.png", tags: ["AIoT", "Embedded", "System integration"],
    sections: [
      { heading: "Build", text: "The project connected embedded hardware, software and intelligent processing into a working AIoT flow. My contribution included system integration and engineering delivery under a short competition timeline." },
      { heading: "Recognition", text: "The team placed Top 2 in FPT IoT Challenge 2025. The corresponding certificate is available on the Awards wall." },
    ],
  },
  {
    id: "savina", area: "work", category: "Embedded & IoT", kind: "SELECTED PROJECT",
    title: "SAVINA · humanitarian logistics AIoT",
    summary: "An AIoT logistics MVP with hardware–software integration and real-time monitoring, recognized at HumanLog 2025.",
    thumbnail: "/portfolio/projects/humanlog2025_banner.png", tags: ["Humanitarian technology", "AIoT", "Monitoring"],
    sections: [
      { heading: "Purpose", text: "SAVINA explores how connected sensing and software can support humanitarian logistics. It is a technology project for a social-impact challenge, rather than a claim of charity or club membership." },
      { heading: "Delivery", text: "The team built a working MVP spanning firmware, edge AI and software integration with real-time monitoring." },
      { heading: "Recognition", text: "SAVINA finished 2nd Runner-up at HumanLog Hackathon 2025, among 165 teams. The certificate is shown in Awards." },
    ],
  },
  {
    id: "wrist-fall", area: "research", category: "Intelligent sensing", kind: "PAPER / PDF",
    title: "Explainable Compact Neural Network for Wrist-Based Fall Detection and Direction Recognition with UCI Feature Pruning — Subject-Independent Evaluation on BITS and WEDA",
    summary: "Subject-independent evaluation on BITS and WEDA with UCI feature pruning for compact, explainable wrist-sensor inference.",
    thumbnail: "/portfolio/research/wrist-fall-overview.png", document: { label: "Read paper PDF", href: "/portfolio/research/wrist-fall-detection.pdf" },
    tags: ["Fall detection", "Explainable AI", "Wearables", "BITS / WEDA"],
    sections: [
      { heading: "Research question", text: "Can a compact neural network detect falls and recognize direction from wrist-worn sensing while remaining interpretable and useful under subject-independent evaluation?" },
      { heading: "Approach", text: "The study combines UCI-guided feature pruning with a compact neural architecture and explainability analysis. BITS and WEDA provide the evaluation datasets." },
      { heading: "Read the paper", text: "The full manuscript is available as a local PDF above. Refer to the paper for experimental protocol, quantitative results, authors and publication details." },
    ],
  },
  {
    id: "phuoc-os",
    area: "work",
    category: "Interface systems",
    kind: "BUILD NOTE",
    title: "PHUOC.OS: a personal engineering workstation",
    summary:
      "A desktop-like portfolio that brings a profile, experiments, and navigation into one interactive space.",
    tags: ["Next.js", "Interaction", "Canvas 2D"],
    sections: [
      {
        heading: "The idea",
        text: "The site treats a portfolio as a small workstation. Floating windows keep the short recruiter path visible while leaving room to explore work and research in more depth.",
      },
      {
        heading: "How it is built",
        text: "Next.js and React manage routes and window state. A Canvas 2D neural field sits behind the interface; motion pauses when the tab is hidden or reduced motion is selected. The backend is a separate FastAPI service so the public site can run on its own.",
      },
      {
        heading: "What to try",
        text: "Open the file launcher on Home, drag a window, use the command palette, or visit the neural core. The visible details are working parts of this repository, rather than placeholder case-study outcomes.",
      },
    ],
  },
  {
    id: "nav-ai",
    area: "work",
    category: "ML experiments",
    kind: "LIVE EXPERIMENT",
    title: "NAV.AI: draw a route through the site",
    summary:
      "A handwritten digit becomes a navigation command, with inference running entirely in the browser.",
    tags: ["ONNX Runtime Web", "MNIST", "Interaction"],
    sections: [
      {
        heading: "The interaction",
        text: "Draw a number from 1 to 6 on the Home popup. A small convolutional network identifies the digit and opens the matching destination when confidence is high enough. Direct buttons remain available if recognition is uncertain.",
      },
      {
        heading: "The model path",
        text: "The canvas image is cropped, fitted into a 20 × 20 box, centred by pixel mass, and passed to a local ONNX MNIST model through WebAssembly. The interface reports the model's predicted digit, confidence and inference time.",
      },
      {
        heading: "Privacy and limits",
        text: "The drawing stays in the browser. MNIST recognises simple digits, so unusual handwriting can be misread; the visible destination buttons are the reliable alternate path.",
      },
    ],
  },
  {
    id: "milo",
    area: "work",
    category: "Interface systems",
    kind: "INTERACTION STUDY",
    title: "Milo: a companion that belongs to the workspace",
    summary:
      "Layered pixel art, procedural movement and a small chat window give the portfolio a resident character.",
    tags: ["SVG", "Motion", "FastAPI"],
    sections: [
      {
        heading: "Motion with a purpose",
        text: "Milo can patrol, stretch, run, jump to a window edge and climb a wall. Dragging moves him to another part of the screen; clicking lets him rest. Animation slows or stops when the visitor requests less motion.",
      },
      {
        heading: "Conversation",
        text: "The chat interface sends conversation turns to a FastAPI endpoint prepared for Groq. The API key belongs on the backend; until it is configured, the interface shows an honest connection state and keeps direct navigation shortcuts available.",
      },
    ],
  },
  {
    id: "digit-preprocessing",
    area: "research",
    category: "Computer vision",
    kind: "RESEARCH NOTE",
    title: "Why preprocessing changes handwritten recognition",
    summary:
      "A close look at cropping, scaling and centre of mass in the browser-side digit experiment.",
    tags: ["Image preprocessing", "MNIST", "ONNX"],
    sections: [
      {
        heading: "The question",
        text: "A digit drawn in a browser occupies an arbitrary region of a canvas. The model expects a much smaller, centred 28 × 28 image. How much of the user experience depends on getting that transformation right?",
      },
      {
        heading: "Current method",
        text: "The NAV.AI experiment finds the ink bounds, keeps the original aspect ratio, scales the mark into 20 × 20 pixels and centres it using intensity-weighted mass. This mirrors the shape and positioning of the data the model was trained to read.",
      },
      {
        heading: "Open questions",
        text: "Stroke thickness, anti-aliasing and off-centre writing still affect confidence. This page is a working research note about the site's implementation, not a peer-reviewed publication or a claim of measured accuracy.",
      },
    ],
  },
  {
    id: "browser-inference",
    area: "research",
    category: "Edge AI",
    kind: "RESEARCH NOTE",
    title: "What belongs on the device?",
    summary:
      "The portfolio's digit model offers a small test case for latency, privacy and deployment trade-offs.",
    tags: ["Edge inference", "WebAssembly", "Privacy"],
    sections: [
      {
        heading: "A small deployment question",
        text: "The handwritten navigation feature loads a pretrained model only when recognition is requested. Its WebAssembly runtime and model are hosted with the frontend, so drawing data never needs an API round trip.",
      },
      {
        heading: "What can be observed",
        text: "The interface displays inference latency and confidence for each attempt. These values describe this browser run; they do not establish performance across devices or user populations.",
      },
      {
        heading: "Next measurements",
        text: "A fuller study would compare cold-load time, inference time, model size and recognition quality on actual mobile and embedded-class devices. Those measurements have not been published here yet.",
      },
    ],
  },
  {
    id: "human-ai-interface",
    area: "research",
    category: "Human–AI interaction",
    kind: "DESIGN NOTE",
    title: "Making model uncertainty visible",
    summary: "A lightweight interface experiment in confidence, fallback paths and user control.",
    tags: ["Confidence", "UX", "On-device AI"],
    sections: [
      {
        heading: "The interface problem",
        text: "A model prediction is only useful if the visitor knows what happened and can recover from a mistake. NAV.AI shows the digit, confidence and latency instead of treating recognition as a hidden magic step.",
      },
      {
        heading: "The current decision",
        text: "High-confidence digits from 1 to 6 open a destination automatically. Lower-confidence or out-of-range results leave the visitor in control, and each destination is also a regular button.",
      },
      {
        heading: "What remains to learn",
        text: "The 65% threshold is an interaction choice, not a calibrated accuracy guarantee. A user study and a representative drawing set would be needed before making stronger claims.",
      },
    ],
  },
];
