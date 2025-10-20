import React from "react";
import { Room } from "@/types/room";
import Image from "next/image";
import { formatVNDLocale, formatDate } from "@/lib/format";
import { btnSm } from "@/lib/ui";
import { useI18n } from "@/lib/i18n";

export default function RoomCard({
  room,
  cheapThreshold,
}: {
  room: Room;
  cheapThreshold: number;
}) {
  const { t, lang } = useI18n();
  const isCheap = room.price <= cheapThreshold;
  return (
    <div className="border-2 border-black rounded-lg p-3 flex gap-3 bg-[#fffbe6] shadow-[6px_6px_0_0_#000]">
      {room.images?.[0] ? (
        <Image
          src={room.images[0]}
          alt={room.title}
          width={144}
          height={112}
          className="w-36 h-28 object-cover rounded-md border-2 border-black"
          priority
        />
      ) : (
        <div className="w-36 h-28 object-cover rounded-md border-2 border-black bg-[#e0e0e0] flex items-center justify-center text-xs text-gray-700">
          {t("no_image")}
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-extrabold text-lg md:text-xl tracking-tight">
            {room.title}
          </h3>
          {isCheap && (
            <span className="text-xs bg-[#32CD32] text-black px-2 py-1 rounded border-2 border-black">
              {t("cheap_badge")}
            </span>
          )}
          {room.isOwner && (
            <span className="text-xs bg-[#ffe066] text-black px-2 py-1 rounded border-2 border-black">
              {t("owner_badge")}
            </span>
          )}
          {typeof room.spamScore === "number" && (
            <span className="text-xs bg-[#ff8787] text-black px-2 py-1 rounded border-2 border-black">
              {t("trust_score")}:{" "}
              {Math.max(0, Math.min(1, 1 - room.spamScore)).toFixed(2)}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-700">
          {room.address} • {room.district} • {room.area} m²
        </div>
        <div className="mt-1 font-bold text-[#0f172a] bg-[#ffd3e0] inline-block px-2 py-1 border-2 border-black rounded">
          {formatVNDLocale(room.price, lang)}
        </div>
        {room.amenities && room.amenities.length > 0 && (
          <div className="mt-2 flex gap-1 flex-wrap">
            {room.amenities.slice(0, 6).map((a, idx) => (
              <span
                key={idx}
                className="text-xs bg-[#a0e7e5] text-black px-2 py-1 rounded border-2 border-black"
              >
                {a}
              </span>
            ))}
          </div>
        )}
        <div className="text-xs text-gray-700 mt-1" suppressHydrationWarning>
          {t("source_prefix")} {room.source} • {t("posted_prefix")} {formatDate(room.postedAt, lang)}
        </div>
        <div className="mt-2 flex gap-2">
          <a
            href={room.url}
            target="_blank"
            rel="noreferrer"
            className={`${btnSm} bg-[#a0e7e5]`}
          >
            {t("view_source")}
          </a>
          {room.location && (
            <a
              href={`https://www.google.com/maps?q=${room.location.coordinates[1]},${room.location.coordinates[0]}`}
              target="_blank"
              rel="noreferrer"
              className={`${btnSm} bg-[#c0eb75]`}
            >
              {t("view_location")}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
