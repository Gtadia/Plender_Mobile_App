export default function timeToSec({ hour, minute, second }: { hour: number, minute: number, second: number }) {
  return hour * 3600 + minute * 60 + second;
}