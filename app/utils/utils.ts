export const formatDate = (isoString: string) => {
  const d = new Date(isoString);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}.${month}.${year} - ${hours}:${minutes}`;
};

export const isInPast = (dateInput: string) => {
  const d = new Date(dateInput);
  const now = new Date();
  return d.getTime() < now.getTime();
}