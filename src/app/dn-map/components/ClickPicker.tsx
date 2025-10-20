"use client";

import { useMapEvents } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";

export default function ClickPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      const { lat, lng } = e.latlng;
      onPick(lat, lng);
    },
  });
  return null;
}