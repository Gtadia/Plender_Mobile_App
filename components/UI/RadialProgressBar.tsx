import { colorTheme$ } from "@/utils/stateManager";
import { observer } from "@legendapp/state/react";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { View } from "react-native";

// var { width, height } = Dimensions.get("window");

const RADIUS = 305 / 2;
const DIAMETER = 2 * RADIUS;

const RadialProgressBar = observer(
  ({ time_goal, time_spent, currentHandler, item }: any) => {
    const color = "#e68f40"; // TODO — gradient change based on percentage completed (color-interpolate --> reanimated)
    const radius = RADIUS;
    const strokeWidth = 30;

    const innerRadius = radius - strokeWidth / 2;
    const outerDiameter = radius * 2;
    const outerBuffer = strokeWidth / 2;

    const path = Skia.Path.Make();
    path.addCircle(radius + outerBuffer, radius + outerBuffer, innerRadius);


    const strokeWidth2 = strokeWidth / 2;
    const radius2 = (RADIUS + (strokeWidth) / 2);

    const innerRadius2 = radius2 - strokeWidth2 / 2;
    const outerDiameter2 = radius2 * 2;
    const outerBuffer2 = strokeWidth2 / 2;

    const outerPath = Skia.Path.Make();
    outerPath.addCircle(radius2 + outerBuffer2, radius2 + outerBuffer2, innerRadius2)

    return (
      <View style={{justifyContent: "center", alignItems: "center", paddingTop: strokeWidth2}}>
        <View
          style={{
            width: outerDiameter + strokeWidth,
            height: outerDiameter + strokeWidth,
            transform: [{ rotate: "-90deg" }],
          }}
        >
          <Canvas style={{ flex: 1 }}>
            <Path
              path={path}
              strokeWidth={strokeWidth}
              style={"stroke"}
              color={colorTheme$.colorTheme.surface1.get()}
              strokeJoin={"round"}
              strokeCap={"round"}
              start={0}
              end={1}
            />
            <Path
              path={path}
              strokeWidth={strokeWidth}
              style={"stroke"}
              color={colorTheme$.colors.accent.get()}
              strokeJoin={"round"}
              strokeCap={"round"}
              start={0}
              end={0.70}
            />
          </Canvas>
        </View>

        <View
          style={{
            width: outerDiameter2 + strokeWidth2,
            height: outerDiameter2 + strokeWidth2,
            transform: [{ rotate: "-90deg" }],
            top: -1 * (outerDiameter2 + strokeWidth2/2)
          }}
        >
          <Canvas style={{ flex: 1 }}>
            <Path
              path={outerPath}
              strokeWidth={strokeWidth2}
              style={"stroke"}
              color={colorTheme$.colors.subtext0.get()}
              strokeJoin={"round"}
              strokeCap={"round"}
              start={0}
              end={1}
            />

            <Path
              path={outerPath}
              strokeWidth={strokeWidth2}
              style={"stroke"}
              color={colorTheme$.colors.secondary.get()}
              strokeJoin={"round"}
              strokeCap={"round"}
              start={0}
              end={0.7}
            />
          </Canvas>
        </View>
      </View>
    );
  }
);

export default RadialProgressBar;
