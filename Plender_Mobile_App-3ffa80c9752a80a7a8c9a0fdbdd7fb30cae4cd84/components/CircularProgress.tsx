import { View, Text } from 'react-native'
import React from 'react'
import { observer } from '@legendapp/state/react';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';

type styling = {
  radius: number;
  strokeWidth: number;
  color: string;
}
type props = {
  percentage?: number;
  styling: styling;
}

const CircularProgress = observer(
  ({percentage = 0, styling}: props) => {
    const color = styling.color; // TODO — gradient change based on percentage completed (color-interpolate --> reanimated)
    const radius = styling.radius;
    const strokeWidth = styling.strokeWidth;

    const innerRadius = radius - strokeWidth / 2;
    const outerDiameter = radius * 2;
    const outerBuffer = strokeWidth / 2;

    const path = Skia.Path.Make();
    path.addCircle(radius + outerBuffer, radius + outerBuffer, innerRadius);

    return (
      <View>
        <View>
          <View
            style={{
              width: outerDiameter + strokeWidth,
              height: outerDiameter + strokeWidth,
            }}
          >
            <Canvas style={{ flex: 1 }}>
              <Path
                path={path}
                strokeWidth={strokeWidth}
                style={"stroke"}
                color={"#333438"}
                strokeJoin={"round"}
                strokeCap={"round"}
                start={0}
                end={1}
              />
              <Path
                path={path}
                strokeWidth={strokeWidth}
                style={"stroke"}
                color={color}
                strokeJoin={"round"}
                strokeCap={"round"}
                start={0}
                end={percentage}
              />
            </Canvas>
          </View>
        </View>
      </View>
    );
  }
)

export default CircularProgress


