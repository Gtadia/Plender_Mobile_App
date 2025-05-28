import { observer } from "@legendapp/state/react";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { View } from "react-native";

// var { width, height } = Dimensions.get("window");

const RADIUS = 30;
const DIAMETER = 2 * RADIUS;

const RadialProgressBar = observer(
  ({ time_goal, time_spent, currentHandler, item }: any) => {
    const color = "#e68f40"; // TODO — gradient change based on percentage completed (color-interpolate --> reanimated)
    const radius = RADIUS;
    const strokeWidth = 8;

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
              transform: [{ rotate: "-90deg" }],
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
                end={item.time_spent.get() / item.time_goal.get()}
              />
            </Canvas>
          </View>
        </View>
      </View>
    );
  }
);

export default RadialProgressBar;