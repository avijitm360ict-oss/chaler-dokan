import { NumberFormat, Language } from '../types';

// Convert English digits to Bengali digits
export const toBengaliDigits = (numStr: string | number): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(numStr).replace(/[0-9]/g, (w) => bnDigits[+w]);
};

// Format Paisa into Taka (100 Paisa = 1 Taka) with Bangladeshi comma grouping (Lakh, Crore)
export const formatCurrency = (
  paisa: number | bigint,
  digitFormat: NumberFormat = 'bn',
  showSymbol: boolean = true
): string => {
  const numPaisa = typeof paisa === 'bigint' ? Number(paisa) : paisa;
  const taka = (numPaisa / 100).toFixed(2);
  const [integerPart, decimalPart] = taka.split('.');

  // South Asian / Bangladeshi Number Format (last 3, then groups of 2: 12,34,567.00)
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  let formattedInteger = '';

  if (otherNumbers !== '') {
    formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  } else {
    formattedInteger = lastThree;
  }

  // If decimal is .00, we can display nicely or keep it
  const formattedTaka = decimalPart === '00' 
    ? formattedInteger 
    : `${formattedInteger}.${decimalPart}`;

  const finalDigits = digitFormat === 'bn' ? toBengaliDigits(formattedTaka) : formattedTaka;
  const symbol = showSymbol ? (digitFormat === 'bn' ? '৳ ' : '৳ ') : '';

  return `${symbol}${finalDigits}`;
};

// Convert Taka float to integer Paisa
export const takaToPaisa = (taka: number | string): number => {
  const num = typeof taka === 'string' ? parseFloat(taka) || 0 : taka;
  return Math.round(num * 100);
};

// Format Weight in KG and Sacks
export const formatWeight = (
  kg: number,
  digitFormat: NumberFormat = 'bn',
  lang: Language = 'bn'
): string => {
  const sacks = Math.floor(kg / 50);
  const remainderKg = Math.round((kg % 50) * 100) / 100;

  const kgText = digitFormat === 'bn' ? toBengaliDigits(kg.toFixed(remainderKg === 0 ? 0 : 2)) : kg.toFixed(remainderKg === 0 ? 0 : 2);
  const sacksText = digitFormat === 'bn' ? toBengaliDigits(sacks) : sacks;
  const remainderKgText = digitFormat === 'bn' ? toBengaliDigits(remainderKg) : remainderKg;

  if (sacks > 0 && remainderKg > 0) {
    if (lang === 'bn') {
      return `${sacksText} বস্তা + ${remainderKgText} কেজি (${kgText} কেজি)`;
    }
    return `${sacksText} sack + ${remainderKgText} kg (${kgText} kg)`;
  } else if (sacks > 0 && remainderKg === 0) {
    if (lang === 'bn') {
      return `${sacksText} বস্তা (${kgText} কেজি)`;
    }
    return `${sacksText} sack (${kgText} kg)`;
  }

  return lang === 'bn' ? `${kgText} কেজি` : `${kgText} kg`;
};

// Date formatter
export const formatDateBangla = (dateString: string): string => {
  const date = new Date(dateString);
  const monthsBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const day = toBengaliDigits(date.getDate());
  const month = monthsBn[date.getMonth()];
  const year = toBengaliDigits(date.getFullYear());
  const hours = toBengaliDigits(date.getHours().toString().padStart(2, '0'));
  const minutes = toBengaliDigits(date.getMinutes().toString().padStart(2, '0'));

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};
