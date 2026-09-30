import Link from "next/link";
import Image from "next/image";
import { Icon } from "./ui/icon";

export function SocialPage() {
  return <main id="main" className="social-page">
    <div className="archive-breadcrumb mono"><Link href="/">phuoc@workspace</Link><span>/</span>social</div>
    <h1 className="sr-only">Social impact and community</h1>
    <div className="social-index mono"><span>COMMUNITY / FIELD NOTES</span><span>01 VERIFIED PROJECT</span></div>
    <article className="social-feature">
      <div className="social-feature-image"><Image src="/portfolio/projects/humanlog2025_banner.png" alt="SAVINA team at HumanLog 2025" fill sizes="(max-width: 700px) 100vw, 50vw" /></div>
      <div className="social-feature-body"><span className="eyebrow">01 / TECHNOLOGY FOR IMPACT</span><h2>SAVINA</h2><p className="social-feature-lead">Humanitarian logistics, connected by AIoT.</p><p>SAVINA is a working logistics MVP built for HumanLog 2025. It connects sensing, software and real-time monitoring to explore how engineering can support humanitarian operations.</p><div className="social-feature-foot"><span className="mono">HUMANLOG 2025 / 2ND RUNNER-UP</span><Link href="/work">Read project note <Icon name="arrow" size={14} /></Link></div></div>
    </article>
    <div className="social-pending"><section><span className="mono">02 / CHARITY</span><p>Activities and photos will be added when the details are ready.</p></section><section><span className="mono">03 / CLUBS</span><p>Club work and community roles will be documented here.</p></section></div>
  </main>;
}
