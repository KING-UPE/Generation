import Hero from "@/components/sections/Hero";
import TowerTimeline from "@/components/sections/TowerTimeline";
import VisionAbout from "@/components/sections/VisionAbout";
import Film from "@/components/sections/Film";
import Scale from "@/components/sections/Scale";
import Projection from "@/components/sections/Projection";
import Festival from "@/components/sections/Festival";
import GalleryFlow from "@/components/sections/GalleryFlow";
import Footer from "@/components/sections/Footer";
import ScrollRail from "@/components/ui/ScrollRail";
import Preloader from "@/components/ui/Preloader";

/** Sections 01–02 live upstream; this page starts at 03 by design. */
const MARKERS = [
  { id: "hero", index: "03", label: "Hero" },
  { id: "timeline", index: "04", label: "Events" },
  { id: "vision", index: "05", label: "Vision" },
  { id: "about", index: "06", label: "About" },
  { id: "film", index: "07", label: "After Movie" },
  { id: "scale", index: "08", label: "Built at Scale" },
  { id: "projection", index: "09", label: "Projections" },
  { id: "festival", index: "10", label: "Festival" },
  { id: "flow", index: "11", label: "Gallery" },
];

export default function Home() {
  return (
    <>
      <Preloader />
      <ScrollRail markers={MARKERS} />
      <TowerTimeline>
        <Hero />
      </TowerTimeline>
      <VisionAbout />
      <Film />
      <Scale />
      <Projection />
      <Festival />
      <GalleryFlow />
      <Footer />
    </>
  );
}


