export type TravelMode = 'driving' | 'walking' | 'bicycling' | 'transit';

export const convertDistanceTextToKm = (distanceText: string): number => {
  const matches = distanceText.match(/([\d.]+)\s*(mi|km)/i);
  if (!matches) {
    throw new Error('Unable to parse distance');
  }

  const value = parseFloat(matches[1]);
  const unit = matches[2].toLowerCase();

  if (Number.isNaN(value)) {
    throw new Error('Distance value is not a number');
  }

  return unit === 'mi' ? value * 1.60934 : value;
};
