import { isPlatformiOS } from '../Util';

const fontFamily = {
  primaryBold: 'IBMPlexSans-Bold',
  primaryBoldItalic: 'IBMPlexSans-BoldItalic',
  primaryExtraLight: 'IBMPlexSans-ExtraLight',
  primaryExtraLightItalic: 'IBMPlexSans-ExtraLightItalic',
  primaryItalic: 'IBMPlexSans-Italic',
  primaryLight: 'IBMPlexSans-Light',
  primaryLightItalic: 'IBMPlexSans-LightItalic',
  primaryMedium: 'IBMPlexSans-Medium',
  primaryMediumItalic: 'IBMPlexSans-MediumItalic',
  primaryRegular: isPlatformiOS() ? 'IBMPlexSans' : 'IBMPlexSans-Regular',
  primarySemiBold: 'IBMPlexSans-SemiBold',
  primarySemiBoldItalic: 'IBMPlexSans-SemiBoldItalic',
  primaryThin: 'IBMPlexSans-Thin',
  primaryThinItalic: 'IBMPlexSans-ThinItalic',
};

export default fontFamily;
