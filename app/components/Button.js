import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewPropTypes } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import PropTypes from 'prop-types';
import colors from '../constants/colors';

class Button extends React.Component {
  render() {
    const {
      title,
      onPress,
      buttonColor = colors.WHITE,
      bgColor = colors.DODGER_BLUE,
      toBgColor = bgColor,
      titleStyle,
      buttonStyle,
      buttonHeight = 54,
      borderColor,
    } = this.props;
    return (
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={[bgColor, toBgColor]}
        style={[
          buttonStyle || styles.container,
          {
            height: buttonHeight,
            borderWidth: borderColor ? 2 : 0,
            borderColor,
          },
        ]}>
        <TouchableOpacity
          style={[buttonStyle || styles.container, { height: buttonHeight }]}
          onPress={onPress}>
          <Text
            style={[
              titleStyle || styles.text,
              {
                color: buttonColor,
              },
            ]}>
            {title}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  text: {
    textAlign: 'center',
    height: 28,
    fontSize: 20,
  },
});

Button.propTypes = {
  title: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  buttonColor: PropTypes.string,
  bgColor: PropTypes.string,
  toBgColor: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  titleStyle: PropTypes.any,
  buttonStyle: ViewPropTypes.style,
  borderColor: PropTypes.string,
};

export default Button;
