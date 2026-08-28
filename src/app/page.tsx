import Hero from "@/components/sections/Hero";
import VisionAbout from "@/components/sections/VisionAbout";
import Film from "@/components/sections/Film";
import Archive from "@/components/sections/Archive";
import ScrollRail from "@/components/ui/ScrollRail";

/** Sections 01–02 live upstream; this page starts at 03 by design. */
const MARKERS = [
  { id: "hero", index: "03", label: "Hero" },
  { id: "vision", index: "04", label: "Vision" },
  { id: "about", index: "05", label: "About" },
  { id: "film", index: "06", label: "Film" },
  { id: "archive", index: "07", label: "Archive" },
];

export default function Home() {
  return (
    <>
      <ScrollRail markers={MARKERS} />
      <Hero />
      <VisionAbout />
      <Film />
      <Archive />
    </>
  );
}
