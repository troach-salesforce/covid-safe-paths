import React from 'react';
import { Circle } from 'react-native-maps';

function CustomCircle({ ...props }) {
  const ref = React.useRef();

  function onLayoutCircle() {
    if (ref.current) {
      ref.current.setNativeProps({ fillColor: props.fillColor });
    }
    // call onLayout() from the props if you need it
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Circle ref={ref} onLayout={onLayoutCircle} {...props} />;
}

export default CustomCircle;
