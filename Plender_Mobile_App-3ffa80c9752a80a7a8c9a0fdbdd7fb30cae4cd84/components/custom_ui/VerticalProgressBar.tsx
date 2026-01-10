import { View } from 'react-native'
import React from 'react'
import { observer } from '@legendapp/state/react'
import { Canvas, Path, Skia } from '@shopify/react-native-skia'
import { themeTokens$ } from '@/utils/stateManager'

interface ProgressSegment {
  percentage: number;
  color: string;
}

type ProgBar = ProgressSegment[];

interface param {
  height: number
  width?: number
  progbar: ProgBar
  // color: string
}

const VerticalProgressBar = observer(
  ({ height, width = 15, progbar }: param) => {
    const { colors } = themeTokens$.get();
    // const path = Skia.Path.Make();
    const strokeWidth = width;

    const path = Skia.Path.Make();
    path.moveTo(strokeWidth / 2,  height);
    path.lineTo(strokeWidth / 2, strokeWidth / 2);

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
            color={colors.subtext1}
            strokeJoin={"round"}
            strokeCap={"round"}
            start={0}
            end={1}
          />
          {
            progbar.map((segment, index) => {
              const percentage = segment.percentage;
              const color = segment.color;

              const segmentPath = Skia.Path.Make();
              segmentPath.moveTo(strokeWidth / 2, height * (1 - percentage));
              segmentPath.lineTo(strokeWidth / 2, height);

              return (
                <Path
                  key={index}
                  path={segmentPath}
                  strokeWidth={strokeWidth}
                  style={"stroke"}
                  color={color}
                  strokeJoin={"round"}
                  strokeCap={"round"}
                  start={0}
                  end={1}
                />
              );
            })
          }
        </Canvas>
      </View>
    )
  }
)

export default VerticalProgressBar;
