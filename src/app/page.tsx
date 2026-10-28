import Hero from "@/components/sections/Hero";
import TowerTimeline from "@/components/sections/TowerTimeline";
import EventDetails from "@/components/sections/EventDetails";
import VisionAbout from "@/components/sections/VisionAbout";
import Tickets from "@/components/sections/Tickets";
import Film from "@/components/sections/Film";
import GalleryFlow from "@/components/sections/GalleryFlow";
import Partners from "@/components/sections/Partners";
import Footer from "@/components/sections/Footer";
import ScrollRail from "@/components/ui/ScrollRail";
import Preloader from "@/components/ui/Preloader";

/**
 * The rail, in the order the page is read: the event and how to get in first,
 * then last year's night as the reason to come.
 */
const MARKERS = [
  { id: "hero", index: "01", label: "Hero" },
  { id: "timeline", index: "02", label: "Events" },
  { id: "details", index: "03", label: "Details" },
  { id: "about", index: "04", label: "About" },
  { id: "mission", index: "05", label: "Mission" },
  { id: "tickets", index: "06", label: "Tickets" },
  { id: "film", index: "07", label: "After Movie" },
  { id: "flow", index: "08", label: "Gallery" },
  { id: "partners", index: "09", label: "Partners" },
];

export default function Home() {
  return (
    <>
      <Preloader />
      <ScrollRail markers={MARKERS} />
      <TowerTimeline>
        <Hero />
      </TowerTimeline>
      <EventDetails />
      <VisionAbout />
      <Tickets />
      <Film />
      <GalleryFlow />
      <Partners />
      <Footer />
    </>
  );
}
