import { observable } from "@legendapp/state";
import { fonts } from '@/constants/types';
import { colorTheme } from "@/constants/Colors";
import type { Theme } from '@/node_modules/@react-navigation/native/src/types';
import dayjs from "dayjs";

interface categoryItem {
  label: string,
  color: string,
  id: number
}
export const Category$ = observable<categoryItem[]>([
  {label: 'test', color: 'red', id: 0},
  {label: 'test test, 1 2 3 1 2 3 test', color: 'green', id: 1},
])










export const Tags$ = observable({
  list: { // `value` ==> `id`
    // WARNING: id == 0 DOES NOT WORK with home.tsx's TagsView
    1: {label: 'This is a labe', color: 'black', value: 1},
    2: {label: 'bro', color: 'red', value: 2},
    3: {label: 'what', color: 'blue', value: 3}
  },
  addToList: (id: number, tagItem: { label: string, color: string }) => {
    Tags$.list.set((prev) => ({
      ...prev,
      [id]: {...tagItem, value: id}, // Add/Update the tag with the provided ID
    }));
  }
})

export const selectedDate$ = observable(dayjs());

export const colorTheme$ = observable({
  colorTheme: colorTheme.catppuccin.latte,  // default theme
  nativeTheme: {
    dark: false,
    colors: {
      primary: 'rgb(10, 132, 255)',
      // TODO — Change this so that it changes when 'colorTheme' changes
      background: colorTheme.catppuccin.latte.surface1, // NOTE — this is the background color of the app (the main content covers this area however)
      card: colorTheme.catppuccin.latte.surface1,  // pop up menu?
      text: colorTheme.catppuccin.latte.text,
      border: 'rgb(39, 39, 41)',    // Make it really black (light mode) / white (dark mode)
      notification: 'rgb(255, 69, 58)',
    },
    fonts
  },
  tabBar: {
    iconColor: colorTheme.catppuccin.latte.text,
  },
  colors: {
    primary: colorTheme.catppuccin.latte.yellow,
    secondary: colorTheme.catppuccin.latte.red,
    accent: colorTheme.catppuccin.latte.green,

    background: colorTheme.catppuccin.latte.base, // light/dark

    surface0: colorTheme.catppuccin.latte.surface0, // for something...
    surface1: colorTheme.catppuccin.latte.surface1, // bottom tab bar (aka, secondary background)

    subtext0: colorTheme.catppuccin.latte.subtext0,
    subtext1: colorTheme.catppuccin.latte.subtext1,
    // Add more colors as needed
  },
});

export const styling$ = observable({
  mainContentRadius: 0,  // 55 is the radius of iphone 14 pro max corners

});