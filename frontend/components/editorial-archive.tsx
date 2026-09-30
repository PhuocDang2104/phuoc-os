"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { entries, type EditorialArea } from "@/lib/editorial";
import { Icon } from "./ui/icon";
import { EditorialThumbnail } from "./editorial-thumbnail";

export function EditorialArchive({ area }: { area: EditorialArea }) {
  const content = entries.filter((entry) => entry.area === area);
  const categories = [...new Set(content.map((entry) => entry.category))];
  const [folder, setFolder] = useState("All notes");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.key === "/" && !(event.target as HTMLElement).closest("input, textarea, dialog")) {
        event.preventDefault();
        searchInput.current?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const shown = (() => {
    const needle = query.trim().toLowerCase();
    return content.filter((entry) => {
      const matchesFolder = folder === "All notes" || entry.category === folder;
      const matchesQuery =
        !needle ||
        [entry.title, entry.summary, entry.category, entry.kind, ...entry.tags]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      return matchesFolder && matchesQuery;
    });
  })();
  const article = content.find((entry) => entry.id === selected);
  return (
    <main id="main" className="archive-page">
      <div className="archive-breadcrumb mono">
        <Link href="/">phuoc@workspace</Link>
        <span>/</span>
        {area}
      </div>
      <h1 className="sr-only">{area === "work" ? "Work archive" : "Research notebook"}</h1>
      <div className="archive-layout">
        <aside className="archive-sidebar" aria-label={`${area} folders`}>
          <div className="archive-sidebar-title mono">
            <Icon name="folder" size={13} /> LIBRARY / {area.toUpperCase()}
          </div>
          {["All notes", ...categories].map((category) => (
            <button
              key={category}
              className={folder === category ? "active" : ""}
              aria-pressed={folder === category}
              onClick={() => {
                setFolder(category);
                setSelected(null);
              }}
            >
              <Icon name="folder" size={13} />
              <span>{category}</span>
              <small>
                {String(
                  category === "All notes"
                    ? content.length
                    : content.filter((entry) => entry.category === category).length,
                ).padStart(2, "0")}
              </small>
            </button>
          ))}
          <div className="archive-sidebar-foot mono">INDEXED / LOCAL CONTENT</div>
        </aside>
        <section className="archive-main" aria-label={`${area} articles`}>
          <div className="archive-toolbar">
            <div>
              <span className="archive-toolbar-label mono">
                {article ? "READING / NOTE" : "ALL ARTICLES"}
              </span>
              <strong>{article ? article.category : `${shown.length} entries`}</strong>
            </div>
            <label className="archive-search">
              <Icon name="search" size={15} />
              <input
                ref={searchInput}
                type="search"
                aria-label={`Search ${area} articles`}
                placeholder="Search notes..."
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelected(null);
                }}
              />
              <kbd>/</kbd>
            </label>
          </div>
          {article ? (
            <article className="archive-article">
              <button className="archive-back mono" onClick={() => setSelected(null)}>
                <Icon name="previous" size={13} /> BACK TO INDEX
              </button>
              <div className="archive-article-meta mono">
                <span>{article.kind}</span>
                <span>/{article.category}</span>
              </div>
              <h2>{article.title}</h2>
              <p className="archive-article-lead">{article.summary}</p>
              <EditorialThumbnail id={article.id} src={article.thumbnail} />
              {article.document && <a className="archive-document" href={article.document.href} target="_blank" rel="noreferrer"><Icon name="file" size={15} /> {article.document.label} <Icon name="external" size={14} /></a>}
              <div className="archive-tags">
                {article.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="archive-article-body">
                {article.sections.map((part, index) => (
                  <section key={part.heading}>
                    <span className="mono">
                      0{index + 1} / {part.heading.toUpperCase()}
                    </span>
                    <h3>{part.heading}</h3>
                    <p>{part.text}</p>
                  </section>
                ))}
              </div>
              <button className="archive-back mono" onClick={() => setSelected(null)}>
                <Icon name="previous" size={13} /> ALL NOTES
              </button>
            </article>
          ) : shown.length ? (
            <div className="archive-list">
              {shown.map((entry, index) => (
                <button
                  key={entry.id}
                  className="archive-row"
                  onClick={() => setSelected(entry.id)}
                >
                  <span className="archive-row-number mono">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <EditorialThumbnail id={entry.id} src={entry.thumbnail} />
                  <span className="archive-row-content">
                    <span className="archive-row-kicker mono">
                      {entry.kind} <i /> {entry.category}
                    </span>
                    <strong>{entry.title}</strong>
                    <span className="archive-row-summary">{entry.summary}</span>
                    <span className="archive-row-tags mono">{entry.tags.join(" / ")}</span>
                  </span>
                  <Icon name="external" size={17} />
                </button>
              ))}
            </div>
          ) : (
            <div className="archive-no-results">
              <Icon name="search" size={23} />
              <h2>No matching notes.</h2>
              <p>Try another phrase or choose a different folder.</p>
              <button
                onClick={() => {
                  setQuery("");
                  setFolder("All notes");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
