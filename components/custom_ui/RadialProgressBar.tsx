import { themeTokens$ } from "@/utils/stateManager";
import { observer } from "@legendapp/state/react";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { Dimensions, Pressable, View, Text } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

const MAX_DIAMETER = 800;

const withOpacity = (hex: string, opacity: number) => {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

type Props = {
  dayPercent: number;
  categorySegments: { color: string; value: number }[];
  currentPercent?: number;
  currentColor?: string;
  showCurrentRing?: boolean;
  centerPercentLabel: string;
  centerPrimary: string;
  centerSecondary: string;
  showDayRing?: boolean;
  showStopButton?: boolean;
  onStopPress?: () => void;
  centerPercentOffset?: number;
  centerSecondaryOffset?: number;
};

const RadialProgressBar = observer(
  ({
    dayPercent,
    categorySegments,
    currentPercent = 0,
    currentColor,
    showCurrentRing,
    centerPercentLabel,
    centerPrimary,
    centerSecondary,
    showDayRing = true,
    showStopButton,
    onStopPress,
    centerPercentOffset = 0,
    centerSecondaryOffset = 0,
  }: Props) => {
    const { colors, palette } = themeTokens$.get();
    const windowWidth = Dimensions.get('window').width;

    const strokeWidth = 30;
    const strokeWidth2 = 12;
    const ringGap = 2;

    const diameterBase = windowWidth - 40 - (strokeWidth + strokeWidth2) / 2;
    const DIAMETER = diameterBase > MAX_DIAMETER ? MAX_DIAMETER : diameterBase;
    const RADIUS = DIAMETER / 2;

    const innerRadius = RADIUS - strokeWidth / 2;
    const outerDiameter = RADIUS * 2;
    const outerBuffer = strokeWidth / 2;

    const path = Skia.Path.Make();
    path.addCircle(RADIUS + outerBuffer, RADIUS + outerBuffer, innerRadius);

    const currentRadius = RADIUS + strokeWidth / 2 + ringGap;
    const currentInner = currentRadius - strokeWidth2 / 2;
    const currentDiameter = currentRadius * 2;
    const currentBuffer = strokeWidth2 / 2;
    const outerPath = Skia.Path.Make();
    outerPath.addCircle(currentRadius + currentBuffer, currentRadius + currentBuffer, currentInner);

    const baseSize = outerDiameter + strokeWidth;
    const currentSize = currentDiameter + strokeWidth2;
    const containerSize = showCurrentRing ? currentSize : baseSize;
    const baseOffset = (containerSize - baseSize) / 2;
    const currentOffset = (containerSize - currentSize) / 2;
    const stopBg = withOpacity(palette.overlay0, 0.45);

    let categoryStart = showDayRing ? Math.min(dayPercent, 1) : 0;

    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: strokeWidth2,
          width: containerSize,
          height: containerSize,
        }}
      >
        <View
          style={{
            position: 'absolute',
            width: baseSize,
            height: baseSize,
            left: baseOffset,
            top: baseOffset,
            transform: [{ rotate: '-90deg' }],
          }}
        >
          <Canvas style={{ flex: 1 }}>
              <Path
                path={path}
                strokeWidth={strokeWidth}
                style={"stroke"}
                color={palette.surface1}
                strokeJoin={"round"}
                strokeCap={"round"}
                start={0}
                end={1}
              />
            {categorySegments.map((segment, idx) => {
              const segValue = Math.min(segment.value, 1);
              if (segValue <= 0) return null;
              const start = categoryStart;
              const end = Math.min(start + segValue, 1);
              categoryStart = end;
              return (
                <Path
                  key={`segment-${idx}`}
                  path={path}
                  strokeWidth={strokeWidth}
                  style={"stroke"}
                  color={segment.color}
                  strokeJoin={"round"}
                  strokeCap={"round"}
                  start={start}
                  end={end}
                />
              );
            })}
              {showDayRing ? (
                <Path
                  path={path}
                  strokeWidth={strokeWidth}
                  style={"stroke"}
                  color={colors.accent}
                  strokeJoin={"round"}
                  strokeCap={"round"}
                  start={0}
                  end={Math.min(dayPercent, 1)}
                />
              ) : null}
          </Canvas>
        </View>

        {showCurrentRing && (
          <View
            style={{
              position: 'absolute',
              width: currentSize,
              height: currentSize,
              left: currentOffset,
              top: currentOffset,
              transform: [{ rotate: '-90deg' }],
            }}
          >
            <Canvas style={{ flex: 1 }}>
              <Path
                path={outerPath}
                strokeWidth={strokeWidth2}
                style={"stroke"}
                color={palette.surface1}
                strokeJoin={"round"}
                strokeCap={"round"}
                start={0}
                end={1}
              />
              <Path
                path={outerPath}
                strokeWidth={strokeWidth2}
                style={"stroke"}
                color={currentColor ?? colors.secondary}
                strokeJoin={"round"}
                strokeCap={"round"}
                start={0}
                end={Math.min(currentPercent, 1)}
              />
            </Canvas>
          </View>
        )}

        <Pressable
          onPress={showStopButton ? onStopPress : undefined}
          style={{
            position: 'absolute',
            width: containerSize,
            height: containerSize,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {showStopButton ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 0,
              }}
            >
              <FontAwesome5
                name="play"
                size={120}
                color={withOpacity(colors.subtext0, 0.55)}
                style={{ transform: [{ translateX: 8 }] }}
              />
            </View>
          ) : null}
          <View
            pointerEvents="none"
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: colors.subtext0,
                textAlign: 'center',
                transform: [{ translateY: centerPercentOffset }],
              }}
            >
              {centerPercentLabel}
            </Text>
            <Text
              style={{
                fontSize: 44,
                fontWeight: '800',
                color: colors.textStrong,
                textAlign: 'center',
                lineHeight: 52,
                includeFontPadding: false as any,
              }}
            >
              {centerPrimary}
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.subtext1,
                textAlign: 'center',
                lineHeight: 24,
                includeFontPadding: false as any,
                transform: [{ translateY: centerSecondaryOffset }],
              }}
            >
              {centerSecondary}
            </Text>
          </View>
        </Pressable>
      </View>
    );
  }
);

export default RadialProgressBar;



// DO NOT TOUCH THE COMMENTED CODE BELOW! DO NOT DELETE IT!
// import { themeTokens$ } from "@/utils/stateManager";
// import { observer } from "@legendapp/state/react";
// import { Canvas, Path, Skia } from "@shopify/react-native-skia";
// import { Dimensions, View, Text } from "react-native";

// // var { width, height } = Dimensions.get("window");

// // TODO — Have a max width of like 500px
// // TODO — Diameter = Dimension.

// const MAX_DIAMETER = 800; // TODO — find if this looks good

// const RadialProgressBar = observer(
//   // TODO — Probably don't need any parameters
//   ({ time_goal, time_spent, currentHandler, item }: any) => {
//     const windowWidth = Dimensions.get('window').width;

//     const strokeWidth = 30;
//     const strokeWidth2 = strokeWidth / 2;

//     const DIAMETER = (windowWidth - 40 - (strokeWidth + strokeWidth2)/2) > MAX_DIAMETER ? MAX_DIAMETER : (windowWidth - 40 - (strokeWidth + strokeWidth2)/2);
//     const RADIUS = DIAMETER / 2;

//     const color = "#e68f40"; // TODO — gradient change based on percentage completed (color-interpolate --> reanimated)
//     const radius = RADIUS;



//     const innerRadius = radius - strokeWidth / 2;
//     const outerDiameter = radius * 2;
//     const outerBuffer = strokeWidth / 2;

//     const path = Skia.Path.Make();
//     path.addCircle(radius + outerBuffer, radius + outerBuffer, innerRadius);


//     const radius2 = (RADIUS + (strokeWidth) / 2);

//     const innerRadius2 = radius2 - strokeWidth2 / 2;
//     const outerDiameter2 = radius2 * 2;
//     const outerBuffer2 = strokeWidth2 / 2;

//     const outerPath = Skia.Path.Make();
//     outerPath.addCircle(radius2 + outerBuffer2, radius2 + outerBuffer2, innerRadius2)

//     return (
//       <View style={{justifyContent: "flex-start", alignItems: "center", marginTop: strokeWidth2, height: outerDiameter2 + strokeWidth2 - 5}}>
//               {/* TODO — IDK why I have to subtract by 5... */}
// {/* General Task Progress Radius */}
//         <View
//           style={{
//             width: outerDiameter + strokeWidth,
//             height: outerDiameter + strokeWidth,
//             transform: [{ rotate: "-90deg" }],
//           }}
//         >
//           <Canvas style={{ flex: 1 }}>
//             <Path
//               path={path}
//               strokeWidth={strokeWidth}
//               style={"stroke"}
//               color={themeTokens$.get().palette.surface1}
//               strokeJoin={"round"}
//               strokeCap={"round"}
//               start={0}
//               end={1}
//             />
//             <Path
//               path={path}
//               strokeWidth={strokeWidth}
//               style={"stroke"}
//               color={themeTokens$.get().colors.accent}
//               strokeJoin={"round"}
//               strokeCap={"round"}
//               start={0}
//               end={0.70}
//             />
//           </Canvas>
//         </View>

// {/* Current Task Progress Radius */}
//         <View
//           style={{
//             width: outerDiameter2 + strokeWidth2,
//             height: outerDiameter2 + strokeWidth2,
//             transform: [{ rotate: "-90deg" }],
//             top: -1 * (outerDiameter2 + strokeWidth2/2)
//           }}
//         >
//           <Canvas style={{ flex: 1 }}>
//             <Path
//               path={outerPath}
//               strokeWidth={strokeWidth2}
//               style={"stroke"}
//               color={themeTokens$.get().colors.subtext0}
//               strokeJoin={"round"}
//               strokeCap={"round"}
//               start={0}
//               end={1}
//             />

//             <Path
//               path={outerPath}
//               strokeWidth={strokeWidth2}
//               style={"stroke"}
//               color={themeTokens$.get().colors.secondary}
//               strokeJoin={"round"}
//               strokeCap={"round"}
//               start={0}
//               end={0.7}
//             />
//           </Canvas>
//         </View>

// {/* Info Text */}
//         <View
//           style={{
//             width: outerDiameter2 + strokeWidth2,
//             height: outerDiameter2 + strokeWidth2,
//             top: -1 * ((outerDiameter2 + strokeWidth2) + (outerDiameter2 + strokeWidth2/2)),
//             justifyContent: 'center',
//             alignItems: 'center',
//           }}
//         >
//           <View
//             style={{
//               height: 215,
//               alignItems: 'center',
//               justifyContent: 'center'
//             }}
//           >
//             <Text>
//               {"5%"}
//             </Text>

//             <Text>
//               {"3:15:42"}
//             </Text>

//             <Text>
//               {"4:00:00"}
//             </Text>
//           </View>
//         </View>
//       </View>
//     );
//   }
// );

// export default RadialProgressBar;
