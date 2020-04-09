/**
 * Intersect a set of points against the user's locally stored points.
 *
 * v1 - Unencrypted, simpleminded (minimal optimization).
 */

import { GetStoreData, SetStoreData } from './General';

export async function IntersectSet(concernLocationArray, completion) {
  GetStoreData('LOCATION_DATA', false).then((locationArray = []) => {
    const dayBin = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ]; // Bins for 28 days

    // Sort the concernLocationArray
    const localArray = normalizeData(locationArray);
    const concernArray = normalizeData(concernLocationArray);

    const concernTimeWindow = 1000 * 60 * 60 * 2; // +/- 2 hours window
    const concernDistWindow = 60; // distance of concern, in feet

    // At 38 degrees North latitude:
    const ftPerLat = 364000; // 1 deg lat equals 364,000 ft
    const ftPerLon = 288200; // 1 deg of longitude equals 288,200 ft

    const nowUTC = new Date().toISOString();
    const timeNow = Date.parse(nowUTC);

    // Save a little CPU, no need to do sqrt()
    const concernDistWindowSq = concernDistWindow * concernDistWindow;

    // Both locationArray and concernLocationArray should be in the
    // format [ { "time": 123, "latitude": 12.34, "longitude": 34.56 }]

    for (const loc of localArray) {
      const timeMin = loc.time - concernTimeWindow;
      const timeMax = loc.time + concernTimeWindow;

      let i = binarySearchForTime(concernArray, timeMin);
      if (i < 0) i = -(i + 1);

      while (i < concernArray.length && concernArray[i].time <= timeMax) {
        // Perform a simple Euclidian distance test
        const deltaLat = (concernArray[i].latitude - loc.latitude) * ftPerLat;
        const deltaLon = (concernArray[i].longitude - loc.longitude) * ftPerLon;
        // TODO: Scale ftPer factors based on lat to reduce projection error

        const distSq = deltaLat * deltaLat + deltaLon * deltaLon;
        if (distSq < concernDistWindowSq) {
          // Crossed path.  Bin the count of encounters by days from today.
          const longAgo = timeNow - loc.time;
          const daysAgo = Math.round(longAgo / (1000 * 60 * 60 * 24));

          dayBin[daysAgo] += 1;
        }

        i++;
      }
    }

    // TODO: Show in the UI!
    console.log('Crossing results: ', dayBin);
    SetStoreData('CROSSED_PATHS', dayBin); // TODO: Store per authority?
    completion(dayBin);
  });
}

function normalizeData(arr) {
  // This fixes several issues that I found in different input data:
  //   * Values stored as strings instead of numbers
  //   * Extra info in the input
  //   * Improperly sorted data (can happen after an Import)
  const result = [];

  for (const elem of arr) {
    if ('time' in elem && 'latitude' in elem && 'longitude' in elem) {
      result.push({
        time: Number(elem.time),
        latitude: Number(elem.latitude),
        longitude: Number(elem.longitude),
      });
    }
  }

  result.sort();
  return result;
}

function binarySearchForTime(array, targetTime) {
  // Binary search:
  //   array = sorted array
  //   target = search target
  // Returns:
  //   value >= 0,   index of found item
  //   value < 0,    i where -(i+1) is the insertion point
  let i = 0;
  let n = array.length - 1;

  while (i <= n) {
    // eslint-disable-next-line no-bitwise
    const k = (n + i) >> 1;
    const cmp = targetTime - array[k].time;

    if (cmp > 0) {
      i = k + 1;
    } else if (cmp < 0) {
      n = k - 1;
    } else {
      // Found exact match!
      // NOTE: Could be one of several if array has duplicates
      return k;
    }
  }
  return -i - 1;
}
