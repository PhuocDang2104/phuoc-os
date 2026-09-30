export type EditorialArea = "work" | "research";
export type EditorialEntry = {
  id: string;
  area: EditorialArea;
  category: string;
  kind: string;
  title: string;
  summary: string;
  tags: string[];
  sections: { heading: string; text: string }[];
};

// Notes about implemented work in this repository. Add verified external work here later.
export const entries: EditorialEntry[] = [
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
