import { Stack } from 'expo-router';

export default function CalendarLayout() {
  return (
    <Stack>
      <Stack.Screen name="rowCalendar" options={{ headerShown: false }} />
      <Stack.Screen name="bottomSheet" options={{
        headerShown: false,
        presentation: "transparentModal",
        animation: "fade",
        contentStyle: { backgroundColor: "transparent" },
      }}/>
    </Stack>
  );
}
