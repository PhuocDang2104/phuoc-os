"use client";

import { useRef, useState, type CSSProperties } from "react";
import { profile } from "@/lib/portfolio";
import pages from "@/lib/resume-pages.json";
import { Icon } from "../ui/icon";

// Previews come directly from the original PDF, so embedded PDF plug-ins are
// unnecessary on desktop and mobile. The original remains available below.
export function ResumeViewer() {
  const [fitWidth, setFitWidth] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  return (
    <div className="resume-content">
      <div className="resume-toolbar">
        <span className="mono muted">CV · {pages.length} pages</span>
        <div className="resume-tools">
          <button
            className="resume-fit"
            aria-label={fitWidth ? "Fit full resume page" : "Enlarge resume to fit width"}
            aria-pressed={fitWidth}
            onClick={() => {
              const node = viewport.current;
              const progress = node ? node.scrollTop / node.scrollHeight : 0;
              setFitWidth(!fitWidth);
              requestAnimationFrame(() => {
                if (node) node.scrollTop = progress * node.scrollHeight;
              });
            }}
          >
            <Icon name={fitWidth ? "minimize" : "plus"} size={14} />
            <span>{fitWidth ? "Fit page" : "Enlarge"}</span>
          </button>
          <a className="button button-light" href={profile.resume}
            download="Dang_Nhu_Phuoc_CV_OLP_AI.pdf">
            Download <Icon name="download" size={14} />
          </a>
        </div>
      </div>
      <div className={`resume-pages${fitWidth ? " is-fit-width" : ""}`}
        ref={viewport} role="region" aria-label="Resume pages" tabIndex={0}>
        <div className="resume-page-list">
          {pages.map((page, index) => (
            <figure className="resume-page" key={page.src}
              style={{ "--page-ratio": page.width / page.height } as CSSProperties}>
              {/* Generated from the official CV; preserve crisp text without recompression. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={page.src} width={page.width} height={page.height}
                alt={`Dang Nhu Phuoc — CV, page ${index + 1} of ${pages.length}`}
                draggable={false} />
            </figure>
          ))}
        </div>
      </div>
      <div className="resume-note">
        <span className="mono">SCROLL TO READ</span>
        <a href={profile.resume} target="_blank" rel="noreferrer">
          Open original PDF <Icon name="external" size={12} />
        </a>
      </div>
    </div>
  );
}
