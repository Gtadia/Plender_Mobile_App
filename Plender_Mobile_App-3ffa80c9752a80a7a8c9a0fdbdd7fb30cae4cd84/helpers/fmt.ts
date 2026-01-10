// helper: seconds → H:MM:SS
export const fmt = (s = 0) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${h}:${pad(m)}:${pad(sec)}`;
};

export const fmtDisappearingHour = (s = 0) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${h === 0 ? '' : `${h}:`}${pad(m)}:${pad(sec)}`;
}