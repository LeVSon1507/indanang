export async function geocodeAddress(address) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return { location: null, district: null, error: 'Missing GOOGLE_MAPS_API_KEY' };
  }
  try {
    const q = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${key}&region=VN&language=vi`;
    const res = await fetch(url);
    if (!res.ok) {
      return { location: null, district: null, error: `Geocode failed: ${res.status}` };
    }
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return { location: null, district: null };
    const { lat, lng } = result.geometry?.location || {};
    const location = lat && lng ? { type: 'Point', coordinates: [lng, lat] } : null;
    const district = extractDistrict(result.address_components);
    return { location, district };
  } catch (e) {
    return { location: null, district: null, error: e?.message || String(e) };
  }
}

function extractDistrict(components = []) {
  try {
    for (const c of components) {
      if (c.types?.includes('sublocality_level_1') || c.types?.includes('administrative_area_level_2')) {
        return c.long_name;
      }
    }
    return null;
  } catch {
    return null;
  }
}