/**
 * The facts about Generation 26 that more than one section states.
 *
 * The hero, the details strip, the ticket and the footer all print the date
 * and the venue; kept here so a change to either is one edit, not five.
 */
export const EVENT = {
  name: "Generation 26",
  /** ISO date, for the countdown and the structured data. Local time, Colombo. */
  iso: "2026-12-12T00:00:00+05:30",
  date: "Saturday, 12 December 2026",
  day: "Saturday",
  dayMonth: "12 December",
  year: "2026",
  venue: "Lotus Tower Open Arena",
  city: "Colombo, Sri Lanka",
  time: "6:00 PM",
  crowd: "10,000+",
};

/**
 * Where "Book Now" goes: the event's page on the ticketing platform.
 *
 * Empty until that page exists. While it is empty, every Book Now on the page
 * leads to the tickets section, and the button there says the link is on its
 * way instead of pointing nowhere. Paste the URL here and every one of them
 * goes straight to the platform.
 */
export const TICKET_URL = "";

/**
 * Where a Book Now button should send the reader right now. `onHome` says
 * whether the button is on the home page, where the tickets section is;
 * anywhere else it goes to the home page and on to that section.
 */
export const bookHref = (onHome = true) => TICKET_URL || (onHome ? "#tickets" : "/#tickets");
