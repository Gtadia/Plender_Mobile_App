export default function secToTime({ sec }: {sec: number}) {
  const hour = sec / 3600
  const minute = (sec % 3600) / 60
  const second = sec % 60
}