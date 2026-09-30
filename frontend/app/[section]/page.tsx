import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sections, type SectionId } from "@/lib/portfolio";
import { Icon } from "@/components/ui/icon";
import { EditorialArchive } from "@/components/editorial-archive";
import { AwardsWall } from "@/components/awards-wall";

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
  if (section === "work" || section === "research") return <EditorialArchive area={section} />;
  if (section === "awards") return <AwardsWall />;
  const content = sections[section as SectionId];
  return (
    <main id="main" className="section-page">
      <div className="section-breadcrumb mono">
        <Link href="/">phuoc@workspace</Link>
        <span>/</span>
        {section}
      </div>
      <h1 className="sr-only">{content.label}</h1>
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
