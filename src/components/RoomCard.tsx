import React from "react";
import { Room } from "@/types/room";
import Image from "next/image";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n
  );

const formatDateVI = (d: string | Date) =>
  new Intl.DateTimeFormat("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" }).format(
    typeof d === "string" ? new Date(d) : d
  );

export default function RoomCard({
  room,
  cheapThreshold,
}: {
  room: Room;
  cheapThreshold: number;
}) {
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
          No image
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-extrabold text-lg md:text-xl tracking-tight">
            {room.title}
          </h3>
          {isCheap && (
            <span className="text-xs bg-[#32CD32] text-black px-2 py-1 rounded border-2 border-black">
              Giá rẻ
            </span>
          )}
          {room.isOwner && (
            <span className="text-xs bg-[#ffe066] text-black px-2 py-1 rounded border-2 border-black">
              Chính chủ
            </span>
          )}
          {typeof room.spamScore === "number" && (
            <span className="text-xs bg-[#ff8787] text-black px-2 py-1 rounded border-2 border-black">
              Độ tin cậy: {Math.max(0, Math.min(1, 1 - room.spamScore)).toFixed(2)}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-700">
          {room.address} • {room.district} • {room.area} m²
        </div>
        <div className="mt-1 font-bold text-[#0f172a] bg-[#ffd3e0] inline-block px-2 py-1 border-2 border-black rounded">
          {formatVND(room.price)}
        </div>
        {room.amenities && room.amenities.length > 0 && (
          <div className="mt-2 flex gap-1 flex-wrap">
            {room.amenities.slice(0, 6).map((a, idx) => (
              <span key={idx} className="text-xs bg-[#a0e7e5] text-black px-2 py-1 rounded border-2 border-black">
                {a}
              </span>
            ))}
          </div>
        )}
        <div className="text-xs text-gray-700 mt-1" suppressHydrationWarning>
          Nguồn: {room.source} • Đăng: {formatDateVI(room.postedAt)}
        </div>
        <div className="mt-2 flex gap-2">
          <a
            href={room.url}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-black bg-[#a0e7e5] border-2 border-black px-2 py-1 rounded shadow-[3px_3px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000] text-sm"
          >
            Xem nguồn
          </a>
          {room.location && (
            <a
              href={`https://www.google.com/maps?q=${room.location.coordinates[1]},${room.location.coordinates[0]}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-black bg-[#c0eb75] border-2 border-black px-2 py-1 rounded shadow-[3px_3px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000] text-sm"
            >
              Xem vị trí
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
