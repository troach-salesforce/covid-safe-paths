/**
 * Import a Google JSon into the Database.
 */
import { GetStoreData, SetStoreData } from './General';

function BuildLocalFormat(placeVisit) {
  return {
    latitude: placeVisit.location.latitudeE7 * 10 ** -7,
    longitude: placeVisit.location.longitudeE7 * 10 ** -7,
    time: placeVisit.duration.startTimestampMs,
  };
}

function LocationExists(localDataJSON, loc) {
  let wasImportedBefore = false;

  for (let index = 0; index < localDataJSON.length; ++index) {
    const storedLoc = localDataJSON[index];
    if (
      storedLoc.latitude === loc.latitude &&
      storedLoc.longitude === loc.longitude &&
      storedLoc.time === loc.time
    ) {
      wasImportedBefore = true;
      break;
    }
  }

  return wasImportedBefore;
}

function InsertIfNew(localDataJSON, loc) {
  if (!LocationExists(localDataJSON, loc)) {
    console.log('Importing', loc);
    localDataJSON.push(loc);
  } else {
    console.log('Existing', loc, localDataJSON.indexOf(loc));
  }
}

function Merge(localDataJSON, googleDataJSON) {
  googleDataJSON.timelineObjects.forEach(
    (
      data,
      // index
    ) => {
      // Only import visited places, not paths for now
      if (data.placeVisit) {
        const loc = BuildLocalFormat(data.placeVisit);
        InsertIfNew(localDataJSON, loc);
      }
    },
  );
}

export async function MergeJSONWithLocalData(googleDataJSON) {
  return GetStoreData('LOCATION_DATA', false).then((locationData = []) => {
    Merge(locationData, googleDataJSON);
    console.log('Saving on array');
    SetStoreData('LOCATION_DATA', locationData);
  });
}
