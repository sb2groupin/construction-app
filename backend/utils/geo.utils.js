function getDistance(lat1, lon1, lat2, lon2) {
  const radiusMeters = 6371000;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radiusMeters * c;
}

function isWithinGeoFence(userLat, userLng, siteLat, siteLng, radiusMeters = 500) {
  const distance = getDistance(userLat, userLng, siteLat, siteLng);
  return {
    isValid: distance <= radiusMeters,
    distance: Math.round(distance),
  };
}

module.exports = { getDistance, isWithinGeoFence };
