// Replace src with public image paths when the original documents are available.
// Native image dimensions control the wall frame and inspector; no crop or aspect ratio is imposed.
export type AwardItem = { id: string; label: string; category: string; src: string | null };
export const awards: AwardItem[] = [
  { id: "award-01", label: "Award / 01", category: "Recognition", src: null },
  { id: "certificate-01", label: "Certificate / 01", category: "Certification", src: null },
  { id: "award-02", label: "Award / 02", category: "Recognition", src: null },
];
