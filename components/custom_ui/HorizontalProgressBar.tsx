import { View } from 'react-native'
import React from 'react'
import { observer } from '@legendapp/state/react'
import { Canvas, Path, Skia } from '@shopify/react-native-skia'
import { themeTokens$ } from '@/utils/stateManager'

// TODO — Parameters => width
interface param {
  width: number
  percentage: number
  color: string
}

const HorizontalProgressBar = observer(
  ({ width, percentage, color }: param) => {
    const { colors } = themeTokens$.get();
    // const path = Skia.Path.Make();
    const strokeWidth = 15;

    const path = Skia.Path.Make();
    path.moveTo(strokeWidth / 2,  strokeWidth / 2);
    path.lineTo(width, strokeWidth / 2);


    return (
      <View
        style={{
          width: width + strokeWidth / 2,
          height: strokeWidth,
        }}
      >
        <Canvas style={{ flex: 1 }}>
          <Path
            path={path}
            strokeWidth={strokeWidth}
            style={"stroke"}
            color={colors.subtext1}
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

export default HorizontalProgressBar
