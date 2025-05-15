export const formatWIB = (date: Date): { date: string, time: string, full: string } => {
  const full = date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  const datePart = date.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
  const timePart = date.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' });
  return { date: datePart, time: timePart, full };
};
