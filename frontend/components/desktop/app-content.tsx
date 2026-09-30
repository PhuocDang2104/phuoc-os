"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { profile, type AppId } from "@/lib/portfolio";
import { useWorkstation } from "../shell";
import { Icon } from "../ui/icon";

const DrawToNavigate = dynamic(() => import("../lab/draw-to-navigate"), {
  loading: () => <div className="content-pad muted">Opening the drawing desk…</div>,
  ssr: false,
});

export function AppContent({ id }: { id: AppId }) {
  const { openApp, setWorkspace } = useWorkstation();
  if (id === "about")
    return (
      <>
        <div className="about-content">
          <div className="about-topline">
            <span className="eyebrow">HELLO WORLD. I’M</span>
            <span className="tiny-label">
              <span className="status-dot" /> OPEN TO OPPORTUNITIES
            </span>
          </div>
          <h2>
            Dang Nhu Phuoc<span className="accent">.</span>
          </h2>
          <p className="about-role">AI & Embedded Engineer</p>
          <p className="about-bio">
            I build intelligent systems across hardware,
            <br className="desktop-break" /> firmware, machine learning, and real-world deployment.
          </p>
          <div className="tags">
            {profile.focus.map((focus) => (
              <span key={focus}>{focus}</span>
            ))}
          </div>
          <div className="about-actions">
            <button className="button button-light" onClick={() => openApp("journey")}>
              Explore my journey <Icon name="arrow" size={15} />
            </button>
            <button className="button button-quiet" onClick={() => openApp("resume")}>
              <Icon name="file" size={15} /> Résumé
            </button>
          </div>
        </div>
        <div className="window-footer">
          <span>
            <span className="location-mark">⌖</span> Ho Chi Minh City, Vietnam
          </span>
          <span className="mono">mind → model → machine</span>
        </div>
      </>
    );
  if (id === "snapshot")
    return (
      <div className="snapshot-content">
        <div className="snapshot-heading">
          <span className="eyebrow">AT A GLANCE</span>
          <Icon name="scan" size={17} />
        </div>
        <h2>A foot in both worlds.</h2>
        <p className="snapshot-intro">Intelligent models. Physical systems.</p>
        <dl className="snapshot-list">
          <div>
            <dt>01 / FOCUS</dt>
            <dd>Edge AI & computer vision</dd>
          </div>
          <div>
            <dt>02 / RESEARCH</dt>
            <dd>Vision, efficiency & explainability</dd>
          </div>
          <div>
            <dt>03 / BUILD</dt>
            <dd>Hardware → firmware → inference</dd>
          </div>
        </dl>
        <div className="snapshot-links">
          <Link href="/work">
            Work <Icon name="external" size={13} />
          </Link>
          <Link href="/research">
            Research <Icon name="external" size={13} />
          </Link>
          <Link href="/awards">
            Awards <Icon name="external" size={13} />
          </Link>
          <button onClick={() => openApp("contact")}>
            Let’s talk <Icon name="arrow" size={13} />
          </button>
        </div>
      </div>
    );
  if (id === "contact") return <Contact />;
  if (id === "draw") return <DrawToNavigate />;
  if (id === "stack")
    return (
      <div className="content-pad stack-content">
        <p className="terminal-command">
          <span>❯</span> stack --list
        </p>
        {[
          { category: "AI & VISION", items: "PyTorch · TensorFlow · ONNX · OpenCV" },
          { category: "EMBEDDED", items: "C / C++ · RTOS · BLE · MCU" },
          { category: "RESEARCH", items: "Python · NumPy · SciPy" },
          { category: "TOOLBOX", items: "Git · Docker · Linux" },
        ].map((group) => (
          <div className="stack-group" key={group.category}>
            <span className="eyebrow">{group.category}</span>
            <p>{group.items}</p>
          </div>
        ))}
        <div className="terminal-comment"># the right tool for the real world</div>
      </div>
    );
  if (id === "research")
    return (
      <div className="content-pad">
        <span className="eyebrow">RESEARCH SNAPSHOT</span>
        <h2>Making intelligence practical.</h2>
        <p className="body-copy">
          Current areas of interest, from efficient inference to understanding what a model sees.
        </p>
        <div className="research-themes">
          {profile.research.map((theme, i) => (
            <div key={theme}>
              <span className="mono muted">0{i + 1}</span>
              {theme}
              <Icon name="network" size={16} />
            </div>
          ))}
        </div>
        <Link href="/research" className="button button-light">
          Explore research <Icon name="external" size={14} />
        </Link>
      </div>
    );
  if (id === "journey")
    return (
      <div className="content-pad">
        <span className="eyebrow">A WORK IN PROGRESS, BY DESIGN</span>
        <h2>The path is part of the work.</h2>
        <div className="journey-log">
          <p>
            <span className="accent">❯</span> cat journey.log
          </p>
          <div>
            <span className="log-marker">NOW</span>
            <h3>Building across disciplines</h3>
            <p>Connecting hardware, firmware, computer vision, and machine learning.</p>
            <button className="text-link" onClick={() => openApp("current")}>
              View current focus <Icon name="arrow" size={14} />
            </button>
          </div>
          <div>
            <span className="log-marker muted">NEXT</span>
            <h3>Documenting the journey</h3>
            <p>
              Education, roles, and project milestones will be added with their dates and supporting
              work.
            </p>
          </div>
        </div>
      </div>
    );
  if (id === "current")
    return (
      <div className="content-pad">
        <span className="eyebrow">ON THE WORKBENCH</span>
        <h2>Currently exploring.</h2>
        <div className="current-list">
          {["Edge AI & embedded intelligence", "Computer vision", "Research & explainability"].map(
            (item, i) => (
              <Link href={i ? "/research" : "/work"} key={item}>
                <span className="mono muted">0{i + 1}</span>
                <span>
                  {item}
                  <small>ONGOING FOCUS</small>
                </span>
                <Icon name="external" />
              </Link>
            ),
          )}
        </div>
      </div>
    );
  if (id === "gallery") return <Gallery />;
  if (id === "resume")
    return (
      <div className="resume-content">
        <div className="resume-toolbar">
          <span className="mono muted">CV preview · temporary document</span>
          <a
            className="button button-light"
            href={profile.resume}
            download="Dang-Nhu-Phuoc-Resume.pdf"
          >
            Download <Icon name="download" size={14} />
          </a>
        </div>
        <iframe
          src={`${profile.resume}#toolbar=0&navpanes=0`}
          title="Dang Nhu Phuoc resume preview"
        />
        <p className="resume-note">
          The complete résumé is being updated.{" "}
          <a href={profile.resume} target="_blank" rel="noreferrer">
            Open PDF in a new tab ↗
          </a>
        </p>
      </div>
    );
  if (id === "quick")
    return (
      <div className="content-pad">
        <span className="eyebrow">THE 30-SECOND OVERVIEW</span>
        <h2>{profile.name}</h2>
        <p className="accent">{profile.role}</p>
        <p className="body-copy">{profile.bio}</p>
        <dl className="overview-details">
          <div>
            <dt>Focus</dt>
            <dd>{profile.focus.join(" · ")}</dd>
          </div>
          <div>
            <dt>Research</dt>
            <dd>Efficient AI, vision & explainability</dd>
          </div>
          <div>
            <dt>Based in</dt>
            <dd>{profile.location}</dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>
              <span className="status-dot" /> Open to opportunities
            </dd>
          </div>
        </dl>
        <div className="button-row">
          <a className="button button-light" href={profile.resume} download>
            Résumé <Icon name="download" size={14} />
          </a>
          <a className="button" href={`mailto:${profile.email}`}>
            Email <Icon name="mail" size={14} />
          </a>
          <a className="button" href={profile.linkedin} target="_blank" rel="noreferrer">
            LinkedIn <Icon name="external" size={14} />
          </a>
        </div>
      </div>
    );
  if (id === "experiments")
    return (
      <div className="content-pad">
        <span className="eyebrow">SMALL BUILDS. OPEN QUESTIONS.</span>
        <h2>Experiment registry.</h2>
        <div className="experiment-list">
          <button onClick={() => openApp("draw")}>
            <span className="mono muted">EXP–001</span>
            <strong>Handwritten navigation</strong>
            <span className="live-label">LIVE</span>
            <Icon name="external" size={14} />
          </button>
          <button onClick={() => setWorkspace(2)}>
            <span className="mono muted">EXP–002</span>
            <strong>Neural field interaction</strong>
            <span className="live-label">LIVE</span>
            <Icon name="external" size={14} />
          </button>
          <div>
            <span className="mono muted">EXP–003</span>
            <strong>Edge inference benchmark</strong>
            <span className="mono muted">PLANNED</span>
          </div>
          <div>
            <span className="mono muted">EXP–004</span>
            <strong>Interactive sensor viewer</strong>
            <span className="mono muted">PLANNED</span>
          </div>
        </div>
      </div>
    );
  return (
    <div className="content-pad">
      <span className="eyebrow">BUILD NOTES / 001</span>
      <h2>The workstation itself.</h2>
      <p className="body-copy">
        This portfolio is an experiment in making engineering tangible. Windows are a way to
        explore. The neural field is a little glimpse of a computational landscape.
      </p>
      <div className="build-note">
        <span className="mono accent">01</span>
        <div>
          <h3>Inference stays with you.</h3>
          <p>
            The digit recognizer runs locally in your browser. Your drawings never leave this
            device.
          </p>
        </div>
      </div>
      <div className="build-note">
        <span className="mono accent">02</span>
        <div>
          <h3>Personality, with a purpose.</h3>
          <p>
            Milo is a small, local shortcut assistant. Click the cat for a faster route around the
            workspace.
          </p>
        </div>
      </div>
      <Link href="/blog" className="text-link">
        Open the notebook <Icon name="external" size={14} />
      </Link>
    </div>
  );
}

function Contact() {
  const [copyState, setCopyState] = useState("Copy email");
  async function copy() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopyState("Copied to clipboard");
    } catch {
      setCopyState("Copy unavailable — use email link");
    }
  }
  return (
    <div className="content-pad contact-content">
      <p className="terminal-command">
        <span>❯</span> let’s build something meaningful.
      </p>
      {[
        { command: "whoami", text: profile.name },
        { command: "status", text: "Open to opportunities" },
        { command: "location", text: profile.location },
      ].map((item) => (
        <div className="contact-line" key={item.command}>
          <span>~/{item.command}</span>
          <p>{item.text}</p>
        </div>
      ))}
      <div className="contact-line">
        <span>~/mail</span>
        <a href={`mailto:${profile.email}`}>
          {profile.email} <Icon name="external" size={14} />
        </a>
      </div>
      <div className="button-row">
        <button className="button button-light" onClick={copy} aria-live="polite">
          <Icon name="mail" size={14} />
          {copyState}
        </button>
        <a className="button" href={profile.github} target="_blank" rel="noreferrer">
          <Icon name="github" size={15} /> GitHub
        </a>
        <a className="button" href={profile.linkedin} target="_blank" rel="noreferrer">
          <Icon name="linkedin" size={15} /> LinkedIn
        </a>
      </div>
    </div>
  );
}

function Gallery() {
  const [selected, setSelected] = useState(0);
  const categories = [
    {
      name: "edge_intelligence/",
      title: "Intelligence at the edge",
      description:
        "Models, embedded inference, and the engineering that connects them to real devices.",
    },
    {
      name: "computer_vision/",
      title: "Teaching machines to see",
      description:
        "Computer vision systems and the questions behind reliable visual understanding.",
    },
    {
      name: "experiments/",
      title: "Curiosity, made interactive",
      description:
        "Small, working experiments. Start with the handwritten navigation model in the AI Lab.",
    },
  ];
  const { openApp } = useWorkstation();
  return (
    <div className="file-browser">
      <div className="file-path">
        phuoc / work <span>3 directories</span>
      </div>
      <div className="file-browser-columns">
        <div className="file-list">
          {categories.map((category, index) => (
            <button
              key={category.name}
              onClick={() => setSelected(index)}
              aria-pressed={selected === index}
            >
              <Icon name="folder" size={17} />
              {category.name}
            </button>
          ))}
        </div>
        <div className="file-preview">
          <div className="folder-art">
            <Icon name={selected === 2 ? "flask" : "cpu"} size={58} />
            <span className="mono">{selected === 2 ? "LAB / LIVE" : "WORK / IN PREPARATION"}</span>
          </div>
          <h3>{categories[selected].title}</h3>
          <p className="body-copy">{categories[selected].description}</p>
          {selected === 2 ? (
            <button className="text-link" onClick={() => openApp("draw")}>
              Try the experiment <Icon name="arrow" size={14} />
            </button>
          ) : (
            <Link href="/work" className="text-link">
              Open work index <Icon name="external" size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
