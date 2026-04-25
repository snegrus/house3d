export type SunStudySettings = {
  latitude: number;
  longitude: number;
  timeZone: string;
  date: string;
  timeMinutes: number;
  modelNorthDegrees: number;
};

export type SunPosition = {
  altitudeDegrees: number;
  azimuthDegrees: number;
  direction: {
    x: number;
    y: number;
    z: number;
  };
};

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
const JULIAN_UNIX_EPOCH = 2440588;
const JULIAN_J2000 = 2451545;
const EARTH_OBLIQUITY = 23.4397 * RAD;

export function getSunPosition(settings: SunStudySettings): SunPosition {
  const date = zonedDateTimeToUtc(settings.date, settings.timeMinutes, settings.timeZone);
  const d = toDays(date);
  const coords = sunCoords(d);
  const latitude = settings.latitude * RAD;
  const longitudeWest = -settings.longitude * RAD;
  const hourAngle = siderealTime(d, longitudeWest) - coords.rightAscension;
  const altitude = altitudeFor(hourAngle, latitude, coords.declination);
  const azimuthFromNorth = normalizeDegrees((azimuthFor(hourAngle, latitude, coords.declination) * 180) / Math.PI + 180);
  const altitudeDegrees = (altitude * 180) / Math.PI;
  const azimuthRadians = azimuthFromNorth * RAD;
  const northRadians = settings.modelNorthDegrees * RAD;
  const northVector = {
    x: Math.sin(northRadians),
    z: Math.cos(northRadians),
  };
  const eastVector = {
    x: -northVector.z,
    z: northVector.x,
  };
  const direction = {
    x: (northVector.x * Math.cos(azimuthRadians) + eastVector.x * Math.sin(azimuthRadians)) * Math.cos(altitude),
    y: Math.sin(altitude),
    z: (northVector.z * Math.cos(azimuthRadians) + eastVector.z * Math.sin(azimuthRadians)) * Math.cos(altitude),
  };

  return {
    altitudeDegrees,
    azimuthDegrees: azimuthFromNorth,
    direction,
  };
}

export function getSunPath(settings: SunStudySettings, stepMinutes = 20): SunPosition[] {
  const positions: SunPosition[] = [];
  for (let timeMinutes = 0; timeMinutes < 24 * 60; timeMinutes += stepMinutes) {
    const position = getSunPosition({ ...settings, timeMinutes });
    if (position.altitudeDegrees > 0) positions.push(position);
  }
  return positions;
}

export function formatTimeMinutes(timeMinutes: number) {
  const hours = Math.floor(timeMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = Math.round(timeMinutes % 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDayOfYear(dateText: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  return Math.floor((current - start) / DAY_MS) + 1;
}

export function getDateStringFromDayOfYear(year: number, dayOfYear: number) {
  const date = new Date(Date.UTC(year, 0, dayOfYear));
  return getLocalDateString(date);
}

export function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function getMonthMarkers(year: number) {
  return [
    { label: "Jan", day: 1 },
    { label: "Feb", day: 32 },
    { label: "Mar", day: isLeapYear(year) ? 61 : 60 },
    { label: "Apr", day: isLeapYear(year) ? 92 : 91 },
    { label: "May", day: isLeapYear(year) ? 122 : 121 },
    { label: "Jun", day: isLeapYear(year) ? 153 : 152 },
    { label: "Jul", day: isLeapYear(year) ? 183 : 182 },
    { label: "Aug", day: isLeapYear(year) ? 214 : 213 },
    { label: "Sep", day: isLeapYear(year) ? 245 : 244 },
    { label: "Oct", day: isLeapYear(year) ? 275 : 274 },
    { label: "Nov", day: isLeapYear(year) ? 306 : 305 },
    { label: "Dec", day: isLeapYear(year) ? 336 : 335 },
  ];
}

function toDays(date: Date) {
  return toJulian(date) - JULIAN_J2000;
}

function toJulian(date: Date) {
  return date.getTime() / DAY_MS - 0.5 + JULIAN_UNIX_EPOCH;
}

function solarMeanAnomaly(d: number) {
  return RAD * (357.5291 + 0.98560028 * d);
}

function eclipticLongitude(meanAnomaly: number) {
  const equationOfCenter =
    RAD * (1.9148 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly) + 0.0003 * Math.sin(3 * meanAnomaly));
  const perihelion = RAD * 102.9372;
  return meanAnomaly + equationOfCenter + perihelion + Math.PI;
}

function sunCoords(d: number) {
  const meanAnomaly = solarMeanAnomaly(d);
  const longitude = eclipticLongitude(meanAnomaly);
  return {
    declination: declination(longitude, 0),
    rightAscension: rightAscension(longitude, 0),
  };
}

function rightAscension(longitude: number, latitude: number) {
  return Math.atan2(Math.sin(longitude) * Math.cos(EARTH_OBLIQUITY) - Math.tan(latitude) * Math.sin(EARTH_OBLIQUITY), Math.cos(longitude));
}

function declination(longitude: number, latitude: number) {
  return Math.asin(Math.sin(latitude) * Math.cos(EARTH_OBLIQUITY) + Math.cos(latitude) * Math.sin(EARTH_OBLIQUITY) * Math.sin(longitude));
}

function siderealTime(d: number, longitudeWest: number) {
  return RAD * (280.16 + 360.9856235 * d) - longitudeWest;
}

function azimuthFor(hourAngle: number, latitude: number, declinationValue: number) {
  return Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(latitude) - Math.tan(declinationValue) * Math.cos(latitude));
}

function altitudeFor(hourAngle: number, latitude: number, declinationValue: number) {
  return Math.asin(Math.sin(latitude) * Math.sin(declinationValue) + Math.cos(latitude) * Math.cos(declinationValue) * Math.cos(hourAngle));
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function zonedDateTimeToUtc(dateText: string, timeMinutes: number, timeZone: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  const hours = Math.floor(timeMinutes / 60);
  const minutes = Math.floor(timeMinutes % 60);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  const zoned = getZonedParts(utcGuess, timeZone);
  const zonedAsUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second);
  const requestedAsUtc = Date.UTC(year, month - 1, day, hours, minutes, 0);
  return new Date(utcGuess.getTime() + (requestedAsUtc - zonedAsUtc));
}

function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const valueFor = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: valueFor("year"),
    month: valueFor("month"),
    day: valueFor("day"),
    hour: valueFor("hour"),
    minute: valueFor("minute"),
    second: valueFor("second"),
  };
}
