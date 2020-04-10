import { useFocusEffect } from '@react-navigation/native';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RNFS from 'react-native-fs';
// import colors from '../constants/colors';
import LinearGradient from 'react-native-linear-gradient';
import Share from 'react-native-share';
import { SvgXml } from 'react-native-svg';
import RNFetchBlob from 'rn-fetch-blob';
import close from '../assets/svgs/close';
import exportIcon from '../assets/svgs/export';
import Colors from '../constants/colors';
import fontFamily from '../constants/fonts';
import languages from '../locales/languages';
import { LocationData } from '../services/LocationService';
import { isPlatformiOS } from '../Util';

const base64 = RNFetchBlob.base64;

function ExportScreen(props) {
  const { shareButtonDisabled } = props;
  // eslint-disable-next-line no-unused-vars
  const [pointStats, setPointStats] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [buttonDisabled, setButtonDisabled] = useState(shareButtonDisabled);

  function handleBackPress() {
    props.navigation.goBack();
    return true;
  }

  useFocusEffect(
    React.useCallback(() => {
      const locationData = new LocationData();
      locationData.getPointStats().then((stats) => {
        setPointStats(stats);
        setButtonDisabled(stats.pointCount === 0);
      });
      return () => {};
    }, []),
  );

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return function cleanup() {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  });

  function backToMain() {
    props.navigation.goBack();
  }

  async function onShare() {
    try {
      const locationData = await new LocationData().getLocationData();
      const nowUTC = new Date().toISOString();
      const unixtimeUTC = Date.parse(nowUTC);

      let options = {};
      let jsonData = JSON.stringify(locationData);
      const title = 'PrivateKit.json';
      const filename = `${unixtimeUTC}.json`;
      const message = 'Here is my location log from Private Kit.';
      let url;
      if (isPlatformiOS()) {
        url = `${RNFS.DocumentDirectoryPath}/${filename}`;
        await RNFS.writeFile(url, jsonData, 'utf8')
          .then(() => {
            options = {
              activityItemSources: [
                {
                  placeholderItem: { type: 'url', content: url },
                  item: {
                    default: { type: 'url', content: url },
                  },
                  subject: {
                    default: title,
                  },
                  linkMetadata: { originalUrl: url, url, title },
                },
              ],
            };
          })
          .catch((err) => {
            console.log(err.message);
          });
      } else {
        jsonData = `data:application/json;base64,${base64.encode(jsonData)}`;
        options = {
          title,
          subject: title,
          url: jsonData,
          message,
          filename,
        };
      }
      await Share.open(options)
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
          console.log(err.message, err.code);
        });
      if (isPlatformiOS()) {
        await RNFS.unlink(url);
      }
    } catch (error) {
      console.log(error.message);
    }
  }

  return (
    <>
      <StatusBar
        barStyle='light-content'
        backgroundColor={Colors.VIOLET_BUTTON}
        translucent={false}
      />
      <SafeAreaView style={styles.topSafeAreaContainer} />
      <SafeAreaView style={styles.bottomSafeAreaContainer}>
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          colors={[Colors.VIOLET_BUTTON, Colors.VIOLET_BUTTON_DARK]}
          style={{ flex: 1, height: '100%' }}>
          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backArrowTouchable} onPress={() => backToMain()}>
              <SvgXml style={styles.backArrow} xml={close} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.contentContainer}>
            <View style={styles.main}>
              <Text style={styles.exportSectionTitles}>
                {languages.t('label.tested_positive_title')}
              </Text>
              <Text style={styles.exportSectionPara}>{languages.t('label.export_para_1')}</Text>
              <Text style={styles.exportSectionPara}>{languages.t('label.export_para_2')}</Text>

              <TouchableOpacity style={styles.exportButton} onPress={onShare}>
                <Text style={styles.exportButtonText}>
                  {languages.t('label.share_location_data')}
                </Text>
                <SvgXml style={styles.exportIcon} xml={exportIcon} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  // Container covers the entire screen
  topSafeAreaContainer: {
    flex: 0,
    backgroundColor: Colors.VIOLET_BUTTON,
  },
  bottomSafeAreaContainer: {
    flex: 1,
    backgroundColor: Colors.VIOLET_BUTTON_DARK,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backArrowTouchable: {
    width: 60,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  backArrow: {
    height: 18,
    width: 18,
  },
  contentContainer: {
    flexDirection: 'column',
    width: '100%',
    flex: 1,
    paddingHorizontal: 26,
  },
  row: {
    flexDirection: 'row',
    color: Colors.PRIMARY_TEXT,
    alignItems: 'flex-start',
  },

  exportSectionTitles: {
    color: Colors.WHITE,
    fontSize: 26,
    fontFamily: fontFamily.primaryMedium,
    marginTop: 9,
  },
  exportSectionPara: {
    color: Colors.WHITE,
    fontSize: 18,
    lineHeight: 22.5,
    marginTop: 22,
    fontFamily: fontFamily.primaryRegular,
  },

  exportButton: {
    backgroundColor: Colors.WHITE,
    flexDirection: 'row',
    height: 64,
    borderRadius: 8,
    marginTop: 48,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  exportButtonText: {
    color: Colors.VIOLET,
    fontSize: 20,
    fontFamily: fontFamily.primaryMedium,
  },
  exportIcon: {
    width: 16,
    height: 21,
  },
  main: {
    flex: 1,
    paddingTop: 48,
  },
});

ExportScreen.propTypes = {
  shareButtonDisabled: PropTypes.bool,
};

ExportScreen.defaultProps = {
  shareButtonDisabled: true,
};

export default ExportScreen;
