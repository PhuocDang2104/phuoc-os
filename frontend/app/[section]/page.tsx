import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sections, type SectionId } from "@/lib/portfolio";
import { Icon } from "@/components/ui/icon";

export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}
export const dynamicParams = false;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  return { title: sections[section as SectionId]?.label ?? "Not found" };
}
export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!(section in sections)) notFound();
  const content = sections[section as SectionId];
  return (
    <main id="main" className="section-page">
      <div className="section-breadcrumb mono">
        <Link href="/">phuoc@workspace</Link>
        <span>/</span>
        {section}
      </div>
      <div className="section-heading">
        <span className="eyebrow">
          <span className="accent-line" />
          {content.eyebrow}
        </span>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
      </div>
      <div className="section-index">
        <div className="section-index-title mono">
          INDEX / {content.label.toUpperCase()}
          <span>{String(content.items.length).padStart(2, "0")} AREAS</span>
        </div>
        {content.items.map((item, index) => (
          <div key={item} className="section-index-row">
            <span className="mono muted">0{index + 1}</span>
            <h2>{item}</h2>
            <Icon
              name={section === "research" ? "network" : section === "blog" ? "file" : "folder"}
              size={22}
            />
          </div>
        ))}
      </div>
      <div className="section-empty">
        <Icon name="terminal" size={20} />
        <p>{content.empty}</p>
        <Link href="/" className="text-link">
          Back to the workspace <Icon name="arrow" size={15} />
        </Link>
      </div>
    </main>
  );
}
