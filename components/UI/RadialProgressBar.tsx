import { colorTheme$ } from "@/utils/stateManager";
import { observer } from "@legendapp/state/react";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { Dimensions, View, Text } from "react-native";

// var { width, height } = Dimensions.get("window");

// TODO — Have a max width of like 500px
// TODO — Diameter = Dimension.

const MAX_DIAMETER = 800; // TODO — find if this looks good

const RadialProgressBar = observer(
  ({ time_goal, time_spent, currentHandler, item }: any) => {
    const windowWidth = Dimensions.get('window').width;

    const strokeWidth = 30;
    const strokeWidth2 = strokeWidth / 2;

    const DIAMETER = (windowWidth - 40 - (strokeWidth + strokeWidth2)/2) > MAX_DIAMETER ? MAX_DIAMETER : (windowWidth - 40 - (strokeWidth + strokeWidth2)/2);
    const RADIUS = DIAMETER / 2;

    const color = "#e68f40"; // TODO — gradient change based on percentage completed (color-interpolate --> reanimated)
    const radius = RADIUS;



    const innerRadius = radius - strokeWidth / 2;
    const outerDiameter = radius * 2;
    const outerBuffer = strokeWidth / 2;

    const path = Skia.Path.Make();
    path.addCircle(radius + outerBuffer, radius + outerBuffer, innerRadius);


    const radius2 = (RADIUS + (strokeWidth) / 2);

    const innerRadius2 = radius2 - strokeWidth2 / 2;
    const outerDiameter2 = radius2 * 2;
    const outerBuffer2 = strokeWidth2 / 2;

    const outerPath = Skia.Path.Make();
    outerPath.addCircle(radius2 + outerBuffer2, radius2 + outerBuffer2, innerRadius2)

    return (
      <View style={{justifyContent: "flex-start", alignItems: "center", marginTop: strokeWidth2,             borderWidth: 5,
            borderColor: 'red', height: outerDiameter2 + strokeWidth2 - 5}}>
              {/* TODO — IDK why I have to subtract by 5... */}
{/* General Task Progress Radius */}
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

{/* Current Task Progress Radius */}
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

{/* Info Text */}
        <View
          style={{
            width: outerDiameter2 + strokeWidth2,
            height: outerDiameter2 + strokeWidth2,
            top: -1 * ((outerDiameter2 + strokeWidth2) + (outerDiameter2 + strokeWidth2/2)),
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              height: 215,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text>
              {"5%"}
            </Text>

            <Text>
              {"3:15:42"}
            </Text>

            <Text>
              {"4:00:00"}
            </Text>
          </View>
        </View>
      </View>
    );
  }
);

export default RadialProgressBar;
