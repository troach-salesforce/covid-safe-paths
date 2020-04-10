import React from 'react';
import { View, Text, Dimensions, StyleSheet, ImageBackground, StatusBar } from 'react-native';
import BackgroundImage from '../../assets/images/launchScreen2.png';
import languages from '../../locales/languages';
import ButtonWrapper from '../../components/ButtonWrapper';
import Colors from '../../constants/colors';
import fontFamily from '../../constants/fonts';

const width = Dimensions.get('window').width;

const Onboarding = (props) => {
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle='dark-content' backgroundColor='transparent' translucent />
      <ImageBackground source={BackgroundImage} style={styles.backgroundImage} />
      <View style={styles.contentContainer}>
        <Text style={styles.headerText}>{languages.t('label.launch_screen2_header')}</Text>
        <Text style={styles.subheaderText}>{languages.t('label.launch_screen2_subheader')}</Text>
      </View>
      <View style={styles.footerContainer}>
        <ButtonWrapper
          title={languages.t('label.launch_next')}
          onPress={() => {
            props.navigation.replace('Onboarding3');
          }}
          buttonColor={Colors.WHITE}
          bgColor={Colors.VIOLET_BUTTON}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    width: '100%',
    height: '100%',
    top: '-10%',
    resizeMode: 'cover',
    position: 'absolute',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.INTRO_WHITE_BG,
  },
  contentContainer: {
    width: width * 0.9,
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  headerText: {
    color: Colors.VIOLET,
    fontSize: 26,
    width: width * 0.8,
    fontFamily: fontFamily.primaryMedium,
  },
  subheaderText: {
    marginTop: '6%',
    color: Colors.VIOLET,
    fontSize: 15,
    width: width * 0.8,
    fontFamily: fontFamily.primaryRegular,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    marginBottom: '10%',
    alignSelf: 'center',
  },
});

export default Onboarding;
