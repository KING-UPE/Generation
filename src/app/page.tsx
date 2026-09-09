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

/**
 * The rail, in the order the page is read. Numbered from the top of this page
 * rather than from somewhere upstream of it, and ending on the closing card --
 * which is an anchor inside the gallery rather than a section of its own.
 */
const MARKERS = [
  { id: "hero", index: "01", label: "Hero" },
  { id: "timeline", index: "02", label: "Events" },
  { id: "vision", index: "03", label: "Vision" },
  { id: "about", index: "04", label: "About" },
  { id: "film", index: "05", label: "After Movie" },
  { id: "scale", index: "06", label: "Built at Scale" },
  { id: "projection", index: "07", label: "Projections" },
  { id: "festival", index: "08", label: "Festival" },
  { id: "flow", index: "09", label: "Gallery" },
  { id: "soon", index: "10", label: "Coming soon" },
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


