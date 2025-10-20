"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

export type PanToProps = {
  center: [number, number];
  zoom?: number;
  animate?: boolean;
};

export default function PanTo({
  center,
  zoom = 16,
  animate = true,
}: PanToProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const [lat, lng] = center || [];
    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      Number.isNaN(lat) ||
      Number.isNaN(lng)
    ) {
      return;
    }
    if (animate && typeof map.flyTo === "function") {
      map.flyTo(center, zoom);
    } else {
      map.setView(center, zoom);
    }
  }, [map, center[0], center[1], zoom, animate]);

  return null;
}
