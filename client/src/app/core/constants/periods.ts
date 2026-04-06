export const HISTORICAL_PERIODS = [
  { value: '', label: 'Wszystkie okresy' },
  { value: '1900-1920', label: 'Lata 1900–1920' },
  { value: '1920-1939', label: 'Lata 1920–1939' },
  { value: '1939-1945', label: 'Okres Wojenny (1939–1945)' },
  { value: '1945-1960', label: 'Okres Powojenny (1945–1960)' },
  { value: '1960-1980', label: 'Lata 60-te i 70-te' },
  { value: '1980-2000', label: 'Lata 80-te i 90-te' },
] as const;

/** Only the selectable periods (without "all") — for upload/edit forms */
export const SELECTABLE_PERIODS = HISTORICAL_PERIODS.filter(p => p.value !== '');
