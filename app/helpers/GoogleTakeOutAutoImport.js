/**
 * Checks the download folder, unzips and imports all data from Google TakeOut
 */
import { subscribe, unzip } from 'react-native-zip-archive';
import { MergeJSONWithLocalData } from './GoogleData';

// require the module
const RNFS = require('react-native-fs');

// Google Takout File Format.
const takeoutZip = /^takeout[\w,\s-]+\.zip$/gm;

// Gets Path of the location file for the current month.
function GetFileName() {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const year = new Date().getFullYear();
  const month = monthNames[new Date().getMonth()].toUpperCase();
  return `${RNFS.DownloadDirectoryPath}/Takeout/Location History/Semantic Location History/${year}/${year}_${month}.json`;
}

export async function SearchAndImport() {
  // googleLocationJSON
  console.log('Auto-import start');

  // UnZip Progress Bar Log.
  const progressSub = subscribe(
    ({
      progress,
      //  filePath
    }) => {
      if (Math.trunc(progress * 100) % 10 === 0)
        console.log('Unzipping', Math.trunc(progress * 100), '%');
    },
  );

  // TODO: RNFS.DownloadDirectoryPath is not defined on iOS.
  // Find out how to access Downloads folder.
  if (!RNFS.DownloadDirectoryPath) {
    return;
  }

  RNFS.readDir(RNFS.DownloadDirectoryPath)
    .then((result) => {
      console.log('Checking Downloads Folder');

      // Looking for takeout*.zip files and unzipping them.
      result.forEach((file) => {
        if (takeoutZip.test(file.name)) {
          console.log(
            `Found Google Takeout {file.name} at {file.path}`,
            file.name,
          );

          unzip(file.path, RNFS.DownloadDirectoryPath)
            .then((path) => {
              console.log(`Unzip Completed for ${path} and ${file.path}`);

              RNFS.readFile(GetFileName())
                .then(() => {
                  console.log('Opened file');

                  MergeJSONWithLocalData(JSON.parse(result));
                  progressSub.remove();
                })
                .catch((err) => {
                  console.log(err.message, err.code);
                  progressSub.remove();
                });
            })
            .catch((error) => {
              console.log(error);
              progressSub.remove();
            });
        }
      });
    })
    .catch((err) => {
      console.log(err.message, err.code);
      progressSub.remove();
    });
}
