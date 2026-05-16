export const getIndonesianDate = (date: Date = new Date()) => {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

export const getCurrentSemesterType = (date: Date = new Date()) => {
  const month = date.getMonth(); // 0-11
  // User logic: Jan-Jun (0-5) -> Genap, Jul-Des (6-11) -> Ganjil
  return (month >= 0 && month <= 5) ? 'Genap' : 'Ganjil';
};

export const getCurrentAcademicYearForPhase = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  if (month >= 6) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
};
