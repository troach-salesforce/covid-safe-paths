import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';
import { GetStoreData, SetStoreData } from '../helpers/General';
import { isPlatformAndroid } from '../Util';
import languages from '../locales/languages';

let isBackgroundGeolocationConfigured = false;

export class LocationData {
  constructor() {
    // The desired location interval, and the minimum acceptable interval
    this.locationInterval = 60000 * 5; // Time (in milliseconds) between location information polls.  E.g. 60000*5 = 5 minutes
    // minLocationSaveInterval should be shorter than the locationInterval (to avoid strange skips)
    this.minLocationSaveInterval = Math.floor(this.locationInterval * 0.8); // Minimum time between location information saves.  60000*4 = 4 minutes

    // Maximum time that we will backfill for missing data
    this.maxBackfillTime = 60000 * 60 * 8; // Time (in milliseconds).  60000 * 60 * 8 = 8 hours
  }

  // eslint-disable-next-line class-methods-use-this
  getLocationData() {
    return GetStoreData('LOCATION_DATA').then((locationArrayString) => {
      let locationArray = [];
      if (locationArrayString !== null) {
        locationArray = JSON.parse(locationArrayString);
      }

      return locationArray;
    });
  }

  async getPointStats() {
    const locationData = await this.getLocationData();

    let lastPoint = null;
    let firstPoint = null;
    let pointCount = 0;

    if (locationData.length) {
      lastPoint = locationData.slice(-1)[0];
      firstPoint = locationData[0];
      pointCount = locationData.length;
    }

    return {
      lastPoint,
      firstPoint,
      pointCount,
    };
  }

  saveLocation(location) {
    // Persist this location data in our local storage of time/lat/lon values
    this.getLocationData().then((locationArray) => {
      // Always work in UTC, not the local time in the locationData
      const unixtimeUTC = Math.floor(location.time);
      const unixtimeUTC_28daysAgo = unixtimeUTC - 60 * 60 * 24 * 1000 * 28;

      // Verify that at least the minimum amount of time between saves has passed
      // This ensures that no matter how fast GPS coords are delivered, saving
      // does not happen any faster than the minLocationSaveInterval
      if (locationArray.length >= 1) {
        const lastSaveTime = locationArray[locationArray.length - 1].time;
        if (lastSaveTime + this.minLocationSaveInterval > unixtimeUTC) {
          // console.log('[INFO] Discarding point (too soon):', unixtimeUTC);
          return;
        }
      }

      // Curate the list of points, only keep the last 28 days
      const curated = [];
      for (let i = 0; i < locationArray.length; i++) {
        if (locationArray[i].time > unixtimeUTC_28daysAgo) {
          curated.push(locationArray[i]);
        }
      }

      // Backfill the stationary points, if available
      // The assumption is that if we see a gap in the data, the
      // best guess is that the person was in that location for
      // the entire time.  This makes it easier for a health authority
      // person to have a set of locations over time, and they can manually
      // redact the time frames that aren't correct.
      if (curated.length >= 1) {
        const lastLocationArray = curated[curated.length - 1];

        // Figure out the time to start the backfill from.  Default is
        // the time of the last entry in the location set.
        // To protect ourselves, we won't backfill more than the
        // maxBackfillTime
        let lastRecordedTime = lastLocationArray.time;
        if (unixtimeUTC - lastRecordedTime > this.maxBackfillTime) {
          lastRecordedTime = unixtimeUTC - this.maxBackfillTime;
        }

        for (
          let newTS = lastRecordedTime + this.locationInterval;
          newTS < unixtimeUTC - this.locationInterval;
          newTS += this.locationInterval
        ) {
          const lat_lon_time = {
            latitude: lastLocationArray.latitude,
            longitude: lastLocationArray.longitude,
            time: newTS,
          };
          console.log('[INFO] backfill location:', lat_lon_time);
          curated.push(lat_lon_time);
        }
      }

      // Save the location using the current lat-lon and the
      // recorded GPS timestamp
      const lat_lon_time = {
        latitude: location.latitude,
        longitude: location.longitude,
        time: unixtimeUTC,
      };
      curated.push(lat_lon_time);
      console.log('[INFO] saved location:', lat_lon_time);

      SetStoreData('LOCATION_DATA', curated);
    });
  }
}

export default class LocationServices {
  static start() {
    const locationData = new LocationData();

    // handles edge cases around Android where start might get called again even though
    // the service is already created.  Make sure the listeners are still bound and exit
    if (isBackgroundGeolocationConfigured) {
      BackgroundGeolocation.start();
      return;
    }

    PushNotification.configure({
      // (required) Called when a remote or local notification is opened or received
      onNotification(notification) {
        console.log('NOTIFICATION:', notification);
        // required on iOS only (see fetchCompletionHandler docs: https://github.com/react-native-community/react-native-push-notification-ios)
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },
      requestPermissions: true,
    });

    // PushNotificationIOS.requestPermissions();
    BackgroundGeolocation.configure({
      desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
      stationaryRadius: 5,
      distanceFilter: 5,
      notificationTitle: languages.t('label.location_enabled_title'),
      notificationText: languages.t('label.location_enabled_message'),
      debug: false, // when true, it beeps every time a loc is read
      startOnBoot: true,
      stopOnTerminate: false,
      locationProvider: BackgroundGeolocation.DISTANCE_FILTER_PROVIDER,

      interval: locationData.locationInterval,
      fastestInterval: locationData.locationInterval,
      activitiesInterval: locationData.locationInterval,

      activityType: 'AutomotiveNavigation',
      pauseLocationUpdates: false,
      saveBatteryOnBackground: true,
      stopOnStillActivity: false,
    });

    BackgroundGeolocation.on('location', (location) => {
      // handle your locations here
      /* SAMPLE OF LOCATION DATA OBJECT
                {
                  "accuracy": 20, "altitude": 5, "id": 114, "isFromMockProvider": false,
                  "latitude": 37.4219983, "locationProvider": 1, "longitude": -122.084,
                  "mockLocationsEnabled": false, "provider": "fused", "speed": 0,
                  "time": 1583696413000
                }
            */
      // to perform long running operation on iOS
      // you need to create background task
      BackgroundGeolocation.startTask((taskKey) => {
        // execute long running task
        // eg. ajax post location
        // IMPORTANT: task has to be ended by endTask
        locationData.saveLocation(location);
        BackgroundGeolocation.endTask(taskKey);
      });
    });

    if (isPlatformAndroid()) {
      // This feature only is present on Android.
      BackgroundGeolocation.headlessTask(async (event) => {
        // Application was shutdown, but the headless mechanism allows us
        // to capture events in the background.  (On Android, at least)
        if (event.name === 'location' || event.name === 'stationary') {
          locationData.saveLocation(event.params);
        }
      });
    }

    BackgroundGeolocation.on('error', (error) => {
      console.log('[ERROR] BackgroundGeolocation error:', error);
    });

    BackgroundGeolocation.on('start', () => {
      console.log('[INFO] BackgroundGeolocation service has been started');
    });

    BackgroundGeolocation.on('authorization', (status) => {
      console.log(`[INFO] BackgroundGeolocation authorization status: ${status}`);

      if (status !== BackgroundGeolocation.AUTHORIZED) {
        // we need to set delay or otherwise alert may not be shown
        // setTimeout(
        //   () =>
        //     Alert.alert(
        //       languages.t('label.require_location_information_title'),
        //       languages.t('label.require_location_information_message'),
        //       [
        //         {
        //           text: languages.t('label.yes'),
        //           onPress: () => BackgroundGeolocation.showAppSettings(),
        //         },
        //         {
        //           text: languages.t('label.no'),
        //           onPress: () => console.log('No Pressed'),
        //           style: 'cancel',
        //         },
        //       ],
        //     ),
        //   1000,
        // );
      } else {
        BackgroundGeolocation.start(); // triggers start on start event

        // TODO: We reach this point on Android when location services are toggled off/on.
        //       When this fires, check if they are off and show a Notification in the tray
      }
    });

    BackgroundGeolocation.on('background', () => {
      console.log('[INFO] App is in background');
    });

    BackgroundGeolocation.on('foreground', () => {
      console.log('[INFO] App is in foreground');
    });

    BackgroundGeolocation.on('abort_requested', () => {
      console.log('[INFO] Server responded with 285 Updates Not Required');
      // Here we can decide whether we want stop the updates or not.
      // If you've configured the server to return 285, then it means the server does not require further update.
      // So the normal thing to do here would be to `BackgroundGeolocation.stop()`.
      // But you might be counting on it to receive location updates in the UI, so you could just reconfigure and set `url` to null.
    });

    BackgroundGeolocation.on('http_authorization', () => {
      console.log('[INFO] App needs to authorize the http requests');
    });

    BackgroundGeolocation.on('stop', () => {
      PushNotification.localNotification({
        title: 'Location Tracking Was Disabled',
        message: 'Private Kit requires location services.',
      });
      console.log('[INFO] stop');
    });

    BackgroundGeolocation.on('stationary', () => {
      console.log('[INFO] stationary');
    });

    BackgroundGeolocation.checkStatus((status) => {
      console.log('[INFO] BackgroundGeolocation service is running', status.isRunning);
      console.log('[INFO] BackgroundGeolocation services enabled', status.locationServicesEnabled);
      console.log(`[INFO] BackgroundGeolocation auth status: ${status.authorization}`);

      BackgroundGeolocation.start(); // triggers start on start event
      isBackgroundGeolocationConfigured = true;

      if (!status.locationServicesEnabled) {
        // we need to set delay or otherwise alert may not be shown
        // setTimeout(
        //   () =>
        //     Alert.alert(
        //       languages.t('label.require_location_services_title'),
        //       languages.t('label.require_location_services_message'),
        //       [
        //         {
        //           text: languages.t('label.yes'),
        //           onPress: () => {
        //             if (isPlatformAndroid()) {
        //               // showLocationSettings() only works for android
        //               BackgroundGeolocation.showLocationSettings();
        //             } else {
        //               Linking.openURL('App-Prefs:Privacy'); // Deeplinking method for iOS
        //             }
        //           },
        //         },
        //         {
        //           text: languages.t('label.no'),
        //           onPress: () => console.log('No Pressed'),
        //           style: 'cancel',
        //         },
        //       ],
        //     ),
        //   1000,
        // );
      } else if (!status.authorization) {
        // we need to set delay or otherwise alert may not be shown
        // setTimeout(
        //   () =>
        //     Alert.alert(
        //       languages.t('label.require_location_information_title'),
        //       languages.t('label.require_location_information_message'),
        //       [
        //         {
        //           text: languages.t('label.yes'),
        //           onPress: () => BackgroundGeolocation.showAppSettings(),
        //         },
        //         {
        //           text: languages.t('label.no'),
        //           onPress: () => console.log('No Pressed'),
        //           style: 'cancel',
        //         },
        //       ],
        //     ),
        //   1000,
        // );
      }
    });
  }

  static stop() {
    // unregister all event listeners
    PushNotification.localNotification({
      title: languages.t('label.location_disabled_title'),
      message: languages.t('label.location_disabled_message'),
    });
    BackgroundGeolocation.removeAllListeners();
    BackgroundGeolocation.stop();
    isBackgroundGeolocationConfigured = false;
    SetStoreData('PARTICIPATE', 'false').then(() => {
      // nav.navigate('LocationTrackingScreen', {});
    });
  }
}
