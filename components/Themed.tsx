/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import { colorTheme$, styling$ } from '@/utils/stateManager';
import { Text as DefaultText, View as DefaultView } from 'react-native';
import { observer } from '@legendapp/state/react';

// import { useColorScheme } from './useColorScheme';
import { useColorScheme } from 'react-native';

type ThemeProps = {
  radius?: number;
};

type TextTheme = {
  fontColor?: string;
  fontSize?: string;
}

export type TextProps = TextTheme & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];


export const Text = observer((props: TextProps) => {
  const { style, fontColor, fontSize, ...otherProps } = props;
  const extraStyle = {
    color: fontColor || colorTheme$.colors.text.get(),
    fontSize: 16
  };

  // font color logic
  switch (fontColor) {
    case 'subtext0': {
      extraStyle.color = colorTheme$.colors.subtext0.get();
      break;
    }
    case 'subtext1': {
      extraStyle.color = colorTheme$.colors.subtext1.get();
      break;
    }
    case 'strong': {
      extraStyle.color = colorTheme$.colors.textStrong.get();
      break;
    }
    default: {
      extraStyle.color = colorTheme$.colors.text.get();
      break;
    }
  }

  // font size logic
  switch (fontSize) {
    case 'small': {
      extraStyle.fontSize = 12;
      break;
    }
    case 'medium': {
      extraStyle.fontSize = 16;
      break;
    }
  }

  return <DefaultText style={[extraStyle, style]} {...otherProps} />;
});

export const ScreenView = observer((props: ViewProps) => {
  const { style, radius, ...otherProps } = props;

  const screenTheme = {
    backgroundColor: colorTheme$.colors.background.get(),
    borderRadius: radius || styling$.mainContentRadius.get(),
  }

  return <DefaultView style={[ screenTheme, style]} {...otherProps} />;
});
