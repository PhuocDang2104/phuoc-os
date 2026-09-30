import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Braces,
  Code2,
  Command,
  Cpu,
  FileText,
  FlaskConical,
  Folder,
  Github,
  Layers3,
  Linkedin,
  Mail,
  Maximize2,
  Minimize2,
  Minus,
  Network,
  Route,
  ScanLine,
  Search,
  Sparkles,
  Terminal,
  UserRound,
  X,
} from "lucide-react";

const icons = {
  user: UserRound,
  route: Route,
  terminal: Terminal,
  folder: Folder,
  file: FileText,
  mail: Mail,
  scan: ScanLine,
  spark: Sparkles,
  network: Network,
  layers: Layers3,
  flask: FlaskConical,
  code: Code2,
  cpu: Cpu,
  command: Command,
  search: Search,
  arrow: ArrowRight,
  external: ArrowUpRight,
  download: ArrowDownToLine,
  github: Github,
  linkedin: Linkedin,
  close: X,
  minus: Minus,
  maximize: Maximize2,
  minimize: Minimize2,
  braces: Braces,
};
export function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Component = icons[name as keyof typeof icons] ?? Terminal;
  return <Component size={size} strokeWidth={1.5} className={className} aria-hidden="true" />;
}
