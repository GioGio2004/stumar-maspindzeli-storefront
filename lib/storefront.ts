import type { FunctionReturnType } from "convex/server";
import type { api } from "@/lib/convex/api";

/**
 * Everything the guest app shows comes from one Convex payload that managers
 * edit in the admin's "Guest app" builder. These types follow that payload.
 */
export type StorefrontData = NonNullable<FunctionReturnType<typeof api.guest.storefront.byToken>>;
export type Tile = StorefrontData["tiles"][number];
export type TileType = Tile["type"];
export type Item = StorefrontData["items"][number];
export type ResortEvent = StorefrontData["events"][number];
export type GuestTask = FunctionReturnType<typeof api.guest.requests.list>[number];

export function itemsFor(data: StorefrontData, section?: string) {
  return data.items.filter((item) => !section || item.section === section);
}

/** Items a guest can actually send: requests/offers that still belong to a team. */
export function orderable(items: Item[]) {
  return items.filter((item) => (item.kind === "request" || item.kind === "offer") && Boolean(item.departmentName));
}

/** Money for display: 40, 12.5, never 0.30000000000000004. */
export function gel(amount: number) {
  return `${Math.round(amount * 100) / 100}₾`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Weekday (0 = Sunday) and "HH:MM" right now in the hotel's time zone. */
export function hotelNow(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { weekday: Math.max(0, WEEKDAYS.indexOf(get("weekday"))), hhmm: `${get("hour")}:${get("minute")}` };
}

export function itemByKey(data: StorefrontData, key?: string) {
  return key ? data.items.find((item) => item.key === key) : undefined;
}

/** Events for today in the hotel's week (0 = Sunday). */
export function eventsToday(events: ResortEvent[], weekday: number) {
  return events.filter((e) => !e.daysOfWeek || e.daysOfWeek.length === 0 || e.daysOfWeek.includes(weekday));
}
