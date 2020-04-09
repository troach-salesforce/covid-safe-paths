import AsyncStorage from '@react-native-community/async-storage';
// import _ from 'lodash';

/**
 * Get Data from Store

 *
 * @param {string} key
 * @param {boolean} isString
 */
export async function GetStoreData(key, isString = true) {
  try {
    const data = await AsyncStorage.getItem(key);

    if (isString) {
      return data;
    }

    // Allow default value assignment at caller
    if (!data) return undefined;

    return JSON.parse(data);
  } catch (error) {
    console.log(error.message);
  }
  return false;
}

/**
 * Set data from store

 *
 * @param {string} key
 * @param {object} item
 */
export async function SetStoreData(key, item) {
  try {
    // we want to wait for the Promise returned by AsyncStorage.setItem()
    // to be resolved to the actual value before returning the value
    return await AsyncStorage.setItem(
      key,
      typeof item === 'string' ? item : JSON.stringify(item),
    );
  } catch (error) {
    console.log(error.message);
  }
}
