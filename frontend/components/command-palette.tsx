"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apps, sections, type AppId } from "@/lib/portfolio";
import { useWorkstation } from "./shell";
import { Icon } from "./ui/icon";

function fuzzy(query: string, text: string) {
  let index = 0;
  for (const letter of text.toLowerCase()) if (letter === query[index]) index++;
  return index === query.length;
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { openApp, setWorkspace } = useWorkstation();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [returnFocus] = useState(() => document.activeElement as HTMLElement | null);
  const commands = [
    {
      id: "home",
      label: "Home",
      detail: "Workspace",
      icon: "terminal",
      run: () => {
        setWorkspace(0);
        router.push("/");
      },
    },
    ...Object.entries(sections).map(([id, section]) => ({
      id,
      label: section.label,
      detail: "Page",
      icon: "folder",
      run: () => router.push(`/${id}`),
    })),
    ...Object.entries(apps).map(([id, app]) => ({
      id: `app-${id}`,
      label: app.label,
      detail: app.file,
      icon: app.icon,
      run: () => openApp(id as AppId),
    })),
  ].filter(
    (command) =>
      fuzzy(query.toLowerCase().trim(), command.label) ||
      fuzzy(query.toLowerCase().trim(), command.detail),
  );

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      requestAnimationFrame(() => {
        if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
      });
    };
  }, [returnFocus]);
  useEffect(() => {
    dialog.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [selected]);
  const run = (index: number) => {
    commands[index]?.run();
    onClose();
  };

  return (
    <dialog
      ref={dialog}
      className="command-dialog"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-label="Command palette"
    >
      <div
        className="command-inner"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelected((value) => Math.min(value + 1, commands.length - 1));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelected((value) => Math.max(value - 1, 0));
          }
          if (event.key === "Enter") {
            event.preventDefault();
            run(selected);
          }
        }}
      >
        <div className="command-input">
          <Icon name="search" size={20} />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(0);
            }}
            placeholder="Where do you want to go?"
            aria-label="Search pages and apps"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-results"
            aria-activedescendant={
              commands[selected] ? `command-${commands[selected].id}` : undefined
            }
            autoComplete="off"
          />
          <button className="keycap" onClick={onClose}>
            esc
          </button>
        </div>
        <p className="eyebrow command-caption">YOUR WORKSPACE, ONE COMMAND AWAY</p>
        <div id="command-results" className="command-results" role="listbox" aria-label="Commands">
          {commands.length ? (
            commands.map((command, index) => (
              <button
                key={command.id}
                id={`command-${command.id}`}
                role="option"
                aria-selected={selected === index}
                onPointerMove={() => setSelected(index)}
                onClick={() => run(index)}
              >
                <Icon name={command.icon} />
                <span>{command.label}</span>
                <small>{command.detail}</small>
                <span className="command-enter">↵</span>
              </button>
            ))
          ) : (
            <p className="empty-search">No matching commands. Try “resume” or “lab”.</p>
          )}
        </div>
        <div className="command-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> to navigate
          </span>
          <span>
            <kbd>↵</kbd> to open
          </span>
          <span>
            <kbd>esc</kbd> to close
          </span>
        </div>
      </div>
    </dialog>
  );
}
