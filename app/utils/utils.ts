export const formatDate = (isoString: string) => {
  const d = new Date(isoString);

  const day = String(d.getDate()).padStart(2, '0');
  const weekday = d.toLocaleDateString('cs-CZ', { weekday: 'long' });
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}.${month} ${weekday} ${hours}:${minutes}`;
};

export const isInPast = (dateInput: string): boolean => {
  const d = new Date(dateInput);
  const now = new Date();
  return d.getTime() < now.getTime();
}

export const isToday = (dateInput: string | Date): boolean => {
  const d = new Date(dateInput);
  const now = new Date();

  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}
