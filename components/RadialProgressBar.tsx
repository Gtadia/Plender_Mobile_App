import { observer } from "@legendapp/state/react";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { View } from "react-native";

// var { width, height } = Dimensions.get("window");

const RADIUS = 30;
const DIAMETER = 2 * RADIUS;

type timeBase = {
  time_goal: number;
  time_spent: number;
};
type props = {
  timeBase?: timeBase;
  percentageBase?: number;
  currentHandler?: any;  // TODO — type this
  item?: any;  // TODO — type this
}
// This is implied...
// type percentageBase = {
//   percentage_goal: number;
// }

const RadialProgressBar = observer(
  ({ timeBase, percentageBase=0,  currentHandler, item }: props) => {
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
                end={timeBase === null ? percentageBase : item.time_spent.get() / item.time_goal.get()}
              />
            </Canvas>
          </View>
        </View>
      </View>
    );
  }
);

export default RadialProgressBar;