import React from "react";
import { View, Text } from "react-native";
import { observer } from "@legendapp/state/react";
import { Canvas, RoundedRect, Rect, Mask, Circle } from "@shopify/react-native-skia";
import { colorTheme$ } from "@/utils/stateManager";

type Props = {
  width: number;        // px
  percentage: number;   // 0..1
  color: string;        // progress color
  height?: number;      // default 36
  trackColor?: string;  // background track color
  textColor?: string;   // % text color
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const HorizontalProgressBar = observer(
  ({
    width,
    percentage,
    color,
    height = 40,
    trackColor = colorTheme$.colors.subtext1.get(),
    textColor = "#fff",
  }: Props) => {
    const pct = clamp01(percentage);
    const r = height / 2;

    // Track pill (we’ll also reuse the same geometry as the mask)
    const trackX = 0;
    const trackY = 0;
    const trackW = width;
    const trackH = height;

    // Head center travels from left cap center (r) to right cap center (width - r)
    const inner = Math.max(width - 2 * r, 0);
    const headCX = r + inner * pct;
    const headCY = r;

    // We draw ONE rectangle from the left edge to just past the head center,
    // then clip it with the pill track. Add 1px to avoid AA gaps on some devices.
    const fillW = Math.max(headCX + 1, 0);

    return (
      <View style={{ width, height, justifyContent: "center" }}>
        <Canvas style={{ width, height }}>
          {/* Track */}
          <RoundedRect
            x={trackX}
            y={trackY}
            width={trackW}
            height={trackH}
            r={r}
            color={trackColor}
            antiAlias
          />

          {/* Fill, clipped to the pill track to avoid seams/stripes */}
          <Mask
            mask={
              <RoundedRect
                x={trackX}
                y={trackY}
                width={trackW}
                height={trackH}
                r={r}
                antiAlias
              />
            }
          >
            <Rect x={0} y={0} width={fillW} height={height} color={color} />
          </Mask>

          {/* Head (always drawn so the cap looks attached) */}
          <Circle cx={headCX} cy={headCY} r={r} color={color} />
        </Canvas>

        {/* % label centered in the middle of the bar */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: trackW / 2,
            top: headCY,
            transform: [{ translateX: -14 }, { translateY: -6 }], // tweak for your font
            }}
        >
          <Text style={{ fontSize: 10, fontWeight: "800", color: textColor }}>
            {Math.round(pct * 100)}%
          </Text>
        </View>
      </View>
    );
  }
);

export default HorizontalProgressBar;
