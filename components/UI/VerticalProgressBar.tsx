import { View } from 'react-native'
import React from 'react'
import { observer } from '@legendapp/state/react'
import { Canvas, Path, Skia } from '@shopify/react-native-skia'
import { colorTheme$ } from '@/utils/stateManager'

// TODO — Parameters => width
interface param {
  height: number
  percentage: number
  color: string
}

const VerticalProgressBar = observer(
  ({ height, percentage, color }: param) => {
    // const path = Skia.Path.Make();
    const strokeWidth = 15;

    const path = Skia.Path.Make();
    path.moveTo(strokeWidth / 2,  strokeWidth / 2);
    path.lineTo(strokeWidth / 2, height);

    return (
      <View
        style={{
          width: strokeWidth,
          height: height + strokeWidth / 2,
        }}
      >
        <Canvas style={{ flex: 1 }}>
          <Path
            path={path}
            strokeWidth={strokeWidth}
            style={"stroke"}
            color={colorTheme$.colors.subtext1.get()}
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
    )
  }
)

export default VerticalProgressBar;