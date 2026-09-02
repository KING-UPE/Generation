"use client";

import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { CustomEase } from "gsap/CustomEase";

let registered = false;

if (typeof window !== "undefined" && !registered) {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase);
  CustomEase.create("gen", "0.16, 1, 0.3, 1");
  CustomEase.create("genIO", "0.76, 0, 0.24, 1");
  gsap.defaults({ ease: "gen", duration: 1.1 });
  registered = true;
}

export { gsap, useGSAP, ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase };

// TEMP-VERIFY
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__gsap = { gsap, ScrollTrigger };
}
