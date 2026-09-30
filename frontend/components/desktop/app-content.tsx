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
          <div className="about-id-head mono">
            <span><span className="about-id-symbol">p_</span> PERSONAL IDENTIFICATION</span>
            <span>NO. 001 / 2026</span>
          </div>
          <div className="about-id-main">
            <div className="about-portrait-wrap">
              {/* A verified GitHub profile photo; replace profile.portrait with the final portrait later. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.portrait} alt="Portrait of Dang Nhu Phuoc" width="460" height="460" />
              <span className="about-photo-corner" />
            </div>
            <div className="about-identity">
              <span className="about-field mono">HOLDER / ENGINEER</span>
              <h2>Dang Nhu Phuoc<span className="accent">.</span></h2>
              <p className="about-role">AI & Embedded Engineer</p>
              <p className="about-school mono">HCMUT / Ho Chi Minh City University of Technology</p>
              <div className="about-status mono"><span className="status-dot" /> OPEN TO OPPORTUNITIES</div>
              <div className="about-id-code mono" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
            </div>
          </div>
          <p className="about-bio">{profile.bio}</p>
          <div className="about-id-meta mono"><span>FOCUS <b>Edge AI · Computer Vision · Embedded Systems</b></span><span>RESEARCH <b>Explainable AI · Intelligent sensing</b></span><span>BUILD <b>Hardware · Firmware · Edge inference</b></span></div>
          <div className="about-actions">
            <button className="button button-light" onClick={() => openApp("journey")}>
              View journey <Icon name="arrow" size={15} />
            </button>
            <button className="button button-quiet" onClick={() => openApp("resume")}>
              <Icon name="file" size={15} /> Résumé
            </button>
          </div>
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
      <div className="journey-content">
        <div className="journey-head mono"><span><b>p_</b> PHUOC.OS / JOURNEY.LOG</span><span>2023—2026</span></div>
        <div className="journey-intro"><span className="mono">LEARN / BUILD / RESEARCH / GROW</span><h2>From foundations to intelligent systems<span className="accent">.</span></h2></div>
        <div className="journey-timeline">
          {[
            { year: "2023", type: "FOUNDATION", title: "HCMUT", detail: "Computer Engineering · Ho Chi Minh City University of Technology", href: "/work" },
            { year: "2025", type: "EMBEDDED", title: "FPT Software", detail: "Embedded engineering internship · hardware and firmware", href: "/work" },
            { year: "2026", type: "RESEARCH", title: "MLIoT Lab", detail: "Research assistant · AI for IoT and intelligent sensing", href: "/research" },
            { year: "2026", type: "AI TRACK", title: "FPT Software", detail: "ML/DL AI engineering internship · machine learning and vision", href: "/research" },
          ].map((item, index) => <Link href={item.href} className="journey-milestone" key={`${item.year}-${item.type}`}><span className="journey-year mono">{item.year}<small>{item.type}</small></span><span className="journey-node" /><span className="journey-event"><span className="mono">0{index + 1} / {item.type}</span><strong>{item.title}</strong><small>{item.detail}</small></span><Icon name="arrow" size={15} /></Link>)}
        </div>
        <div className="journey-foot mono">EDGE AI · EMBEDDED SYSTEMS · COMPUTER VISION</div>
      </div>
    );
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
  if (id === "certifications")
    return (
      <div className="content-pad certification-content">
        <span className="eyebrow">CREDENTIALS / DOCUMENTS</span>
        <h2>Certifications.</h2>
        <div className="certification-list">
          <a href="/portfolio/awards/intel-certi.pdf" target="_blank" rel="noreferrer"><Icon name="award" size={16} /><span>Intel AI Global Challenge<small>2025 / PDF certificate</small></span><Icon name="external" size={14} /></a>
          <Link href="/awards"><Icon name="award" size={16} /><span>Competition certificates<small>VNPT · FPT · HumanLog · RMIT · Denso</small></span><Icon name="external" size={14} /></Link>
        </div>
        <Link href="/awards" className="text-link">Visit the awards wall <Icon name="external" size={14} /></Link>
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
    <div className="contact-content">
      <div className="contact-hero mono"><span>01 / DIRECT CHANNEL</span><span className="contact-live"><i /> AVAILABLE</span></div>
      <div className="contact-intro"><span className="eyebrow">LET’S CONNECT</span><h2>Have an idea worth building<span className="accent">?</span></h2><p>Open to engineering opportunities, research collaborations and thoughtful conversations.</p></div>
      <a className="contact-email" href={`mailto:${profile.email}`}><Icon name="mail" size={19} /><span><small>EMAIL / FASTEST WAY TO REACH ME</small><strong>{profile.email}</strong></span><Icon name="external" size={17} /></a>
      <div className="contact-links"><a href={profile.github} target="_blank" rel="noreferrer"><Icon name="github" size={16} /> GitHub <Icon name="external" size={13} /></a><a href={profile.linkedin} target="_blank" rel="noreferrer"><Icon name="linkedin" size={16} /> LinkedIn <Icon name="external" size={13} /></a></div>
      <div className="contact-foot"><span className="mono">HO CHI MINH CITY, VIETNAM</span><button className="mono" onClick={copy} aria-live="polite">{copyState} <Icon name="arrow" size={13} /></button></div>
    </div>
  );
}
