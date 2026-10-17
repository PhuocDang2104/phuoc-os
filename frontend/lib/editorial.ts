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

// Content aligned to the supplied primary CV; MRI is an owner-specified research direction.
export const entries: EditorialEntry[] = [
  {
    id: "vnpt-meetmate",
    area: "work",
    category: "AI systems",
    kind: "PROJECT / 2025",
    title: "Minute · Agentic AI Meeting Workspace",
    summary:
      "An Agentic RAG meeting workspace for BFSI enterprises, built for VNPT AI Hackathon 2025. Team leader · 2nd Runner-up.",
    tags: ["Agentic RAG", "FastAPI", "pgvector", "ASR"],
    thumbnail: "/portfolio/projects/vnpt-ai-banner.png",
    sections: [
      {
        heading: "System",
        text: "A meeting platform integrating real-time VNPT GoMeet ASR, event-driven REST/WebSocket APIs and a private VNPT Cloud backend with FastAPI, PostgreSQL, pgvector and Docker.",
      },
      {
        heading: "Contribution",
        text: "Led the project and optimized a Dockerized Vietnamese–English ASR service. Architecture diagrams, implementation details and additional media can be added here.",
      },
      {
        heading: "Recognition",
        text: "Top 3 among more than 200 teams at VNPT AI Hackathon 2025, as listed in the CV.",
      },
    ],
  },
  {
    id: "fpt-iot",
    area: "work",
    category: "Embedded & IoT",
    kind: "PROJECT / 2025",
    title: "S.C.E.N.T · Smart Customer Experience & Edge AIoT",
    summary:
      "An edge AIoT system for perfume recommendations, inventory and threat monitoring. FPT Software / Silicon Labs IoT Challenge 2025 · 1st Runner-up.",
    tags: ["Edge AI", "BERT", "Silicon Labs", "Raspberry Pi"],
    thumbnail: "/portfolio/projects/iot_challenge_banner.png",
    sections: [
      {
        heading: "System",
        text: "Collected and labeled more than 5,000 real-world interactions across 50+ perfume SKUs. A BERT and spaCy NER pipeline extracts intents and keywords for recommendations and analytics.",
      },
      {
        heading: "Deployment",
        text: "Lightweight Random Forest models run on Silicon Labs EFR32 MCUs and Raspberry Pi for recommendation and breaking/drop detection without a cloud dependency.",
      },
      {
        heading: "Recognition",
        text: "Team leader, 1st Runner-up / Top 2 of 140 teams at FPT IoT Challenge 2025, with an internship certification from FPT Software.",
      },
    ],
  },
  {
    id: "pillars",
    area: "work",
    category: "Embedded & IoT",
    kind: "PROJECT / 2026",
    title: "PILLARS · Parkinson’s Intelligent Living",
    summary:
      "Long-term AIoT remote supervision combining activity sensing, freezing-of-gait and fall-direction recognition, voice classification and MCU deployment.",
    tags: ["DS-TCN", "TreeSHAP", "INT8", "TFLite Micro"],
    thumbnail: "/portfolio/projects/pillars.svg",
    sections: [
      {
        heading: "Sensing and models",
        text: "A leakage-safe multimodal pipeline processes 2.18 million sensor samples with subject-independent evaluation. Feature selection combines LightGBM and TreeSHAP with bootstrap audits; a compact DS-TCN handles freezing-of-gait and fall-direction recognition.",
      },
      {
        heading: "Deployment",
        text: "DS-TCN models were deployed on Silicon Labs MCUs using INT8 quantization. A TENet12 voice classifier was also quantized to full-INT8 TFLite and checked against TFLite Micro C++ outputs.",
      },
      {
        heading: "Recognition",
        text: "The CV lists Top 2 of 687 teams at the global FPT AIoT Challenge 2026. Project photos and the 2026 certificate can be added when available.",
      },
    ],
  },
  {
    id: "greenflow",
    area: "work",
    category: "AI systems",
    kind: "PROJECT / 2026",
    title: "GreenFlow · Agentic Digital Twin",
    summary:
      "Predictive building energy and HVAC control using forecasting, surrogate models and a policy-aware MPC engine. Asian Hackathon for Green Future · Top 30/500.",
    tags: ["LightGBM", "Digital twin", "MPC", "Energy optimization"],
    thumbnail: "/portfolio/projects/greenflow.svg",
    sections: [
      {
        heading: "System",
        text: "LightGBM forecasting and surrogate models were developed on 901,824 EnergyPlus records across 308 zones. The platform combines an agentic digital twin with predictive building control.",
      },
      {
        heading: "Evaluation",
        text: "The CV reports 30,913 kWh saved (8.82%) and an 8.88% peak-demand reduction in a 61-day replay, with zero comfort or policy violations. These are replay results, rather than a claim of measured savings in a deployed building.",
      },
      {
        heading: "Recognition",
        text: "Top 30 of 500 teams globally at Asian Hackathon for Green Future, July 2026. Additional project images, diagrams and the certificate can be added here.",
      },
    ],
  },
  {
    id: "aiming",
    area: "work",
    category: "Computer vision",
    kind: "PROJECT / 2025",
    title: "AIMING · Agricultural Infravision",
    summary:
      "AIoT monitoring, inspection and grading in agriculture using a multi-task vision model and Intel deployment tools.",
    tags: ["MobileNetV3", "ONNX", "OpenVINO", "Multi-task learning"],
    thumbnail: "/portfolio/projects/intel_ai_banner.png",
    sections: [
      {
        heading: "Model and deployment",
        text: "A multi-task MobileNetV3 CNN uses four task-specific heads for agricultural recognition and inspection. Deployment follows Keras → ONNX → OpenVINO IR on Intel hardware.",
      },
      {
        heading: "Recognition",
        text: "Intel AI Global Impact Festival 2025 recognized the project for excellent innovation and impact through AI. The original certificate is available on the Awards wall.",
      },
    ],
  },
  {
    id: "savina",
    area: "work",
    category: "Embedded & IoT",
    kind: "PROJECT / 2025",
    title: "SAVINA · Warehouse Distribution AIoT",
    summary:
      "ESP32-CAM and RFID for warehouse distribution, with lightweight YOLO monitoring and real-time alerts. HumanLog 2025 · 2nd Runner-up.",
    tags: ["ESP32-CAM", "RFID", "YOLO", "Monitoring"],
    thumbnail: "/portfolio/projects/humanlog2025_banner.png",
    sections: [
      {
        heading: "System",
        text: "A lightweight YOLO module detects people in restricted warehouse zones using ESP32-CAM and drone streams, sending real-time alerts to a logistics dashboard.",
      },
      {
        heading: "Recognition",
        text: "2nd Runner-up / Top 3 among 165 teams at HumanLog 2025. Additional implementation notes and media can be added here.",
      },
    ],
  },
  {
    id: "xlstm-ranking",
    area: "work",
    category: "Machine learning",
    kind: "COURSE PROJECT",
    title: "xLSTM · Vietnamese Stock Selection",
    summary:
      "A hybrid direction–excess ranking model for short-horizon stock selection, built for Machine Learning Fundamentals and Applications at HCMUT.",
    tags: ["xLSTM", "Time series", "Ranking", "Benchmarking"],
    thumbnail: "/portfolio/projects/xlstm.svg",
    sections: [
      {
        heading: "Study",
        text: "The model uses 190,657 stock-date samples, 95 symbols and 64-session K-line sequences to rank five stocks over a five-day horizon. Scoring blends return/ranking, direction and excess-return signals.",
      },
      {
        heading: "Evaluation",
        text: "Benchmarks include CNN-LSTM, TCN, PatchTST, histogram gradient boosting and Kronos zero-shot models. Results in the CV are historical out-of-time and proxy backtest evaluations; no future return is implied.",
      },
    ],
  },
  {
    id: "wrist-fall",
    area: "research",
    category: "Intelligent sensing",
    kind: "ACCEPTED PAPER / CSoNet 2026",
    title: "Explainable Wrist-Based Fall Detection & Direction Recognition",
    summary:
      "Compact, explainable multi-task learning on BITS and WEDA with subject-disjoint evaluation. Accepted for CSoNet 2026 · Springer LNCS proceedings.",
    tags: ["Fall detection", "Explainable AI", "Wearables", "BITS / WEDA"],
    thumbnail: "/portfolio/research/wrist-fall-overview.png",
    sections: [
      {
        heading: "Research question",
        text: "Can a compact model detect falls and recognize three fall directions from wrist-worn sensing while remaining interpretable under subject-independent evaluation?",
      },
      {
        heading: "Approach",
        text: "A fold-specific XAI pipeline combines Integrated Gradients, Gradient × Input and Permutation Loss Delta to reduce 561 IMU features to 256. A two-head MLP contains 6,653 parameters and is evaluated across ten subject-disjoint outer folds.",
      },
      {
        heading: "Paper",
        text: "The CV records this work as accepted for CSoNet 2026 in Springer LNCS proceedings. The supplied manuscript is available below; final publication links can be added when available.",
      },
    ],
    document: {
      label: "Read paper PDF",
      href: "/portfolio/research/wrist-fall-detection.pdf",
    },
  },
  {
    id: "depth-completion",
    area: "research",
    category: "Computer vision",
    kind: "IN PROGRESS",
    title: "Depth Completion · JetODE",
    summary:
      "Real-time dense depth completion for low-cost autonomous systems, studied at MLIoT Lab using a compact MobileNetV4–Neural ODE architecture.",
    tags: ["Depth completion", "Neural ODE", "MobileNetV4", "JetODE"],
    thumbnail: "/portfolio/research/depth-completion.svg",
    sections: [
      {
        heading: "Research direction",
        text: "JetODE models local pixel-surface geometry through second-order inverse-depth jets, evolving surface value, gradients and curvature using learned continuous dynamics and numerical integration.",
      },
      {
        heading: "Current study",
        text: "The CV describes a 583K-parameter model and a comparison between static and adaptive ODE solvers. This work is in progress; the paper, figures, code and final evaluation details will be added here.",
      },
    ],
  },
  {
    id: "mri-segmentation-diffusion",
    area: "research",
    category: "Medical imaging",
    kind: "RESEARCH DIRECTION",
    title: "MRI Segmentation & Diffusion",
    summary:
      "MRI segmentation and diffusion modeling. Research details and visual material will be added as the work develops.",
    tags: ["MRI", "Segmentation", "Diffusion"],
    thumbnail: "/portfolio/research/mri-segmentation.svg",
    sections: [
      {
        heading: "Research scope",
        text: "A dedicated space for MRI segmentation and diffusion research. The problem setting, datasets and methodology will be documented here.",
      },
      {
        heading: "Materials",
        text: "Figures, experiments, results, manuscript and code links will be added when available.",
      },
    ],
  },
];
