// Haversine formula — do coordinates ke beech distance nikalo (meters mein)
const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Check karo employee site ke andar hai ya bahar
const isWithinGeoFence = (empLat, empLon, siteLat, siteLon, radiusMeters) => {
  const distance = getDistanceInMeters(empLat, empLon, siteLat, siteLon);
  return { isValid: distance <= radiusMeters, distance: Math.round(distance) };
};

module.exports = { getDistanceInMeters, isWithinGeoFence };
