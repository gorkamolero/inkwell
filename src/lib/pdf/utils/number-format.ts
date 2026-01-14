/**
 * Number Formatting Utilities
 *
 * Shared functions for converting numbers to Roman numerals and words.
 */

const ROMAN_NUMERALS: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

const WORD_ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
  "Twenty",
];

const WORD_TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

/**
 * Convert number to uppercase Roman numerals (I, II, III, IV...)
 */
export function toRoman(num: number): string {
  let result = "";
  let remaining = num;

  for (const [value, numeral] of ROMAN_NUMERALS) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }

  return result;
}

/**
 * Convert number to lowercase Roman numerals (i, ii, iii, iv...)
 */
export function toRomanLower(num: number): string {
  return toRoman(num).toLowerCase();
}

/**
 * Convert number to word (One, Two, Three...)
 * Supports 1-99, falls back to numeric string for larger numbers.
 */
export function toWord(num: number): string {
  if (num <= 20) return WORD_ONES[num];

  if (num < 100) {
    const tensDigit = Math.floor(num / 10);
    const onesDigit = num % 10;
    return WORD_TENS[tensDigit] + (onesDigit > 0 ? `-${WORD_ONES[onesDigit]}` : "");
  }

  return String(num);
}

/**
 * Format chapter number using a format string.
 * Supports: {n} (numeric), {roman} (Roman numerals), {word} (word form)
 */
export function formatChapterNumber(num: number, format: string): string {
  return format
    .replace("{n}", String(num))
    .replace("{roman}", toRoman(num))
    .replace("{word}", toWord(num));
}
