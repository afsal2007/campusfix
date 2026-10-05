export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Haversine formula
  const toRadian = (angle) => (Math.PI / 180) * angle;
  const distance = (a, b) => (Math.PI / 180) * (a - b);
  
  const RADIUS_OF_EARTH_IN_METERS = 6371e3; 
  
  const dLat = distance(lat2, lat1);
  const dLon = distance(lon2, lon1);
  
  const lat1Radian = toRadian(lat1);
  const lat2Radian = toRadian(lat2);
  
  const a = Math.pow(Math.sin(dLat / 2), 2) + Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1Radian) * Math.cos(lat2Radian);
  const c = 2 * Math.asin(Math.sqrt(a));
  
  return RADIUS_OF_EARTH_IN_METERS * c;
};
