import pluralize from 'pluralize';
import languages from '../locales/languages';

export function timeSincePoint(point) {
  if (!point) {
    return languages.t('label.no_data');
  }

  const pointDays = point ? daysDifferenceFromNow(point.time) : null;
  const pointHours = point ? hoursDifferenceFromNow(point.time) : null;
  const pointMinutes = point ? minutesDifferenceFromNow(point.time) : null;
  const pointTime = [
    pointDays > 0 ? pluralize('day', pointDays, true) : null,
    pointHours > 0 ? pluralize('hour', pointHours, true) : null,
    pointMinutes > 0
      ? pluralize('minute', pointMinutes, true)
      : languages.t('label.less_than_one_minute'),
  ]
    .filter((item) => item)
    .join(' ');

  return pointTime;
}

function daysDifferenceFromNow(timestamp) {
  const difference = now() - timestamp;
  const daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
  return daysDifference;
}

function hoursDifferenceFromNow(timestamp) {
  const difference = now() - timestamp;
  const hoursDifference = Math.floor(difference / 1000 / 60 / 60);
  return hoursDifference % 24;
}

function minutesDifferenceFromNow(timestamp) {
  const difference = now() - timestamp;
  const minutesDifference = Math.floor(difference / 1000 / 60);

  return minutesDifference % 60;
}

function now() {
  const nowUTC = new Date().toISOString();
  return Date.parse(nowUTC);
}
