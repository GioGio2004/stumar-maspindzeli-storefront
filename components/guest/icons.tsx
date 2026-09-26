import { createElement } from "react";
import {
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  ChefHat,
  Clock,
  ConciergeBell,
  Droplets,
  Flower2,
  Info,
  Link2,
  MessageCircle,
  Shirt,
  Sparkles,
  Ticket,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";

// Same icon keys the admin stores on catalog items and tiles.
const map: Record<string, LucideIcon> = {
  housekeeping: Sparkles,
  maintenance: Wrench,
  kitchen: ChefHat,
  spa: Flower2,
  reception: ConciergeBell,
  towel: Bath,
  robe: Shirt,
  pillow: BedDouble,
  water: Droplets,
  cleaning: Sparkles,
  repair: Wrench,
  dining: UtensilsCrossed,
  aquapark: Waves,
  ticket: Ticket,
  clock: Clock,
  info: Info,
  link: Link2,
  concierge: MessageCircle,
  requests: ConciergeBell,
  today: CalendarDays,
  stay: Wifi,
  hotels: Building2,
};

export function iconFor(key?: string | null): LucideIcon {
  return (key && map[key]) || ConciergeBell;
}

export const typeIcon: Record<string, LucideIcon> = {
  requests: ConciergeBell,
  menu: UtensilsCrossed,
  booking: Flower2,
  ticket: Waves,
  concierge: MessageCircle,
  events: CalendarDays,
  stay: Wifi,
  links: Building2,
  checkout: Clock,
  info: Info,
};

/** Renders the icon stored under `name` without creating a component during render. */
export function IconByKey({ name, className }: { name?: string | null; className?: string }) {
  return createElement(iconFor(name), { className });
}
