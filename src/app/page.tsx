import Hero from "@/components/sections/Hero";
import TowerTimeline from "@/components/sections/TowerTimeline";
import VisionAbout from "@/components/sections/VisionAbout";
import Film from "@/components/sections/Film";
import GalleryFlow from "@/components/sections/GalleryFlow";
import ScrollRail from "@/components/ui/ScrollRail";
import TimelineTuner from "@/components/ui/TimelineTuner";
import { TimelineTunerProvider } from "@/context/TimelineTunerContext";

/** Sections 01–02 live upstream; this page starts at 03 by design. */
const MARKERS = [
  { id: "hero", index: "03", label: "Hero" },
  { id: "timeline", index: "04", label: "Editions" },
  { id: "vision", index: "05", label: "Vision" },
  { id: "about", index: "06", label: "About" },
  { id: "film", index: "07", label: "Film" },
  { id: "flow", index: "08", label: "Gallery" },
];

export default function Home() {
  return (
    <TimelineTunerProvider>
      <ScrollRail markers={MARKERS} />
      <TowerTimeline>
        <Hero />
      </TowerTimeline>
      <VisionAbout />
      <Film />
      <GalleryFlow />
      <TimelineTuner />
    </TimelineTunerProvider>
  );
}

