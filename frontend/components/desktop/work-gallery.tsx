"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { galleryItems, type GalleryItem } from "@/lib/gallery";
import { useWorkstation } from "../shell";
import { Icon } from "../ui/icon";
import { GalleryArt } from "./gallery-art";

export function WorkGallery() {
  const { closeApp, minimizeApp, focusApp, openApp, setWorkspace, reducedMotion } =
    useWorkstation();
  const router = useRouter();
  const rail = useRef<HTMLDivElement>(null);
  const offset = useRef(0);
  const drag = useRef<{ x: number; scroll: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [copies, setCopies] = useState(2);
  const stopped = paused || hovered || focused || reducedMotion;

  useEffect(() => {
    const element = rail.current!;
    const observer = new ResizeObserver(() => {
      const card = element.querySelector<HTMLElement>(".gallery-card");
      if (card)
        setCopies(
          Math.max(
            1,
            Math.ceil(element.clientWidth / ((card.offsetWidth + 6) * galleryItems.length)),
          ),
        );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = rail.current!;
    let frame = 0,
      last = 0;
    const animate = (time: number) => {
      if (document.hidden) {
        last = 0;
        return;
      }
      if (last) {
        const width = element.scrollWidth / 2;
        offset.current = (offset.current + Math.min(time - last, 48) * 0.027) % width;
        element.scrollLeft = offset.current;
      }
      last = time;
      frame = requestAnimationFrame(animate);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      last = 0;
      if (!document.hidden && !stopped) {
        offset.current = element.scrollLeft;
        frame = requestAnimationFrame(animate);
      }
    };
    resume();
    document.addEventListener("visibilitychange", resume);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [stopped, copies]);

  function open(item: GalleryItem) {
    if ("app" in item.action) openApp(item.action.app);
    if ("workspace" in item.action) setWorkspace(item.action.workspace);
    if ("href" in item.action) router.push(item.action.href);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const distance = event.clientX - drag.current.x;
    if (Math.abs(distance) > 5) {
      drag.current.moved = true;
      suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      const width = event.currentTarget.scrollWidth / 2;
      event.currentTarget.scrollLeft = (((drag.current.scroll - distance) % width) + width) % width;
    }
  }
  function step(direction: number) {
    setPaused(true);
    const element = rail.current;
    if (!element) return;
    const width = element.scrollWidth / 2;
    const distance = (element.querySelector<HTMLElement>(".gallery-card")?.offsetWidth ?? 228) + 6;
    const start = element.scrollLeft % width;
    element.scrollLeft = direction < 0 && start < distance ? start + width : start;
    element.scrollBy({
      left: direction * distance,
      behavior: reducedMotion ? "instant" : "smooth",
    });
  }

  return (
    <section
      className="work-gallery"
      aria-label="Work gallery"
      aria-roledescription="carousel"
      onPointerDownCapture={() => focusApp("gallery")}
    >
      <header className="gallery-titlebar">
        <span>
          <Icon name="folder" size={13} />
          Work Gallery <small>experiments & directions</small>
        </span>
        <div className="gallery-controls">
          <button onClick={() => step(-1)} aria-label="Previous gallery items">
            <Icon name="previous" size={14} />
          </button>
          <button
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? "Play gallery" : "Pause gallery"}
            aria-pressed={paused}
          >
            <Icon name={paused || reducedMotion ? "play" : "pause"} size={12} />
          </button>
          <button onClick={() => step(1)} aria-label="Next gallery items">
            <Icon name="next" size={14} />
          </button>
          <span />
          <button onClick={() => minimizeApp("gallery")} aria-label="Minimize Work gallery">
            <Icon name="minus" size={13} />
          </button>
          <button onClick={() => closeApp("gallery")} aria-label="Close Work gallery">
            <Icon name="close" size={14} />
          </button>
        </div>
      </header>
      <div
        ref={rail}
        className="gallery-rail"
        data-paused={stopped}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => {
          if (!drag.current) setHovered(false);
        }}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          suppressClick.current = false;
          drag.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false };
        }}
        onPointerMove={move}
        onPointerUp={(event) => {
          drag.current = null;
          setHovered(event.pointerType === "mouse" && event.currentTarget.matches(":hover"));
        }}
        onPointerCancel={() => {
          drag.current = null;
          setHovered(false);
        }}
        onClickCapture={(event) => {
          if (suppressClick.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="gallery-group" aria-hidden={copy === 1 ? true : undefined}>
            {Array.from({ length: copies }, () => galleryItems)
              .flat()
              .map((item, index) => (
                <button
                  key={`${item.id}-${index}`}
                  className="gallery-card"
                  tabIndex={copy || index >= galleryItems.length ? -1 : 0}
                  aria-hidden={index >= galleryItems.length ? true : undefined}
                  onClick={() => open(item)}
                  aria-label={`Open ${item.title}`}
                >
                  <div className="gallery-thumbnail">
                    <GalleryArt art={item.art} />
                    <span className="gallery-card-category">{item.category}</span>
                    <span className="gallery-open">
                      <Icon name="external" size={14} />
                    </span>
                  </div>
                  <span className="gallery-card-caption">
                    <small>0{(index % galleryItems.length) + 1}</small>
                    {item.title}
                    <Icon name="external" size={11} />
                  </span>
                </button>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}
