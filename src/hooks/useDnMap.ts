'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import type { PlaceCategory } from '@/types/place';
import { fetcher } from '@/lib/fetcher';

export interface PlaceItem {
  _id?: string;
  title: string;
  address?: string;
  category: PlaceCategory;
  location?: { type: 'Point'; coordinates: [number, number] };
  url?: string;
}

export interface SuggestedPlace {
  title: string;
  address?: string;
  category?: PlaceCategory;
  lat: number;
  lng: number;
  url?: string;
}

export function useDnMap() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('entertainment');
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [desc, setDesc] = useState('');
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedPlace[]>([]);
  const [focus, setFocus] = useState<[number, number] | null>(null);
  const [manualMode, setManualMode] = useState(false);

  const params = new URLSearchParams();
  params.set('limit', '500');
  params.set('category', category);
  const url = `/api/places?${params.toString()}`;

  const { data: placesData, mutate } = useSWR<PlaceItem[]>(url, fetcher);
  const places: PlaceItem[] = useMemo(
    () => (Array.isArray(placesData) ? placesData : []),
    [placesData]
  );

  async function addManual() {
    if (!picked) return alert('Bấm lên bản đồ để chọn vị trí');
    if (!title.trim()) return alert('Nhập tiêu đề địa điểm');
    const res = await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: desc || undefined,
        address: address || undefined,
        category,
        lat: picked.lat,
        lng: picked.lng,
        source: 'manual',
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      alert('Lỗi thêm địa điểm: ' + t);
      return;
    }
    setTitle('');
    setAddress('');
    setDesc('');
    setFocus([picked.lat, picked.lng]);
    setPicked(null);
    mutate();
  }

  async function callSuggest() {
    setLoadingSuggest(true);
    try {
      const res = await fetch('/api/places/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query || undefined,
          category,
          limit: 10,
          save: false,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'OpenAI error');
      setSuggestions(Array.isArray(json.items) ? (json.items as SuggestedPlace[]) : []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert('Lỗi gợi ý: ' + msg);
    } finally {
      setLoadingSuggest(false);
    }
  }

  async function addSuggested(s: SuggestedPlace) {
    const res = await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: s.title,
        description: undefined,
        address: s.address,
        category: s.category || category,
        lat: s.lat,
        lng: s.lng,
        url: s.url,
        source: 'ai',
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      alert('Lỗi thêm gợi ý: ' + t);
      return;
    }
    setFocus([s.lat, s.lng]);
    mutate();
  }

  const resetManual = () => {
    setTitle('');
    setAddress('');
    setDesc('');
    setPicked(null);
    setManualMode(false);
  };

  return {
    places,
    mutate,
    query,
    setQuery,
    category,
    setCategory,
    picked,
    setPicked,
    title,
    setTitle,
    address,
    setAddress,
    desc,
    setDesc,
    loadingSuggest,
    suggestions,
    manualMode,
    setManualMode,
    focus,
    setFocus,
    addManual,
    callSuggest,
    addSuggested,
    resetManual,
  };
}
