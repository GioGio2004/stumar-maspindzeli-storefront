import type { Item, Tile } from "./storefront";

// Photos (WebP files in /public) for the cards and dishes that have one.
// Cards are matched by type, dishes by their catalog key.

const TILE_PHOTOS: Partial<Record<Tile["type"], string>> = {
  ticket: "/photos/water-park.webp",
  checkout: "/photos/late-checkout.webp",
  links: "/photos/gino-hotels.webp",
};

const MENU_PHOTOS: Record<string, string> = {
  "spaghetti-bolognese": "/menu/spaghetti-bolognese.webp",
  "margherita-pizza": "/menu/margherita-pizza.webp",
  "grilled-salmon": "/menu/grilled-salmon.webp",
  "chicken-cream-sauce": "/menu/chicken-cream-sauce.webp",
  "mint-lime-lemonade": "/menu/mint-lime-lemonade.webp",
  cappuccino: "/menu/cappuccino.webp",
  "pistachio-latte": "/menu/pistachio-latte.webp",
  "iced-caramel-latte": "/menu/iced-caramel-latte.webp",
};

export function tilePhoto(tile: Pick<Tile, "type">): string | undefined {
  return TILE_PHOTOS[tile.type];
}

export function itemPhoto(item: Pick<Item, "key">): string | undefined {
  return item.key ? MENU_PHOTOS[item.key] : undefined;
}
