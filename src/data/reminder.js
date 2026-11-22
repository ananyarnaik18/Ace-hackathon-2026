// WhatsApp reminder helpers.
import { formatRupees } from '../utils/format.js';

export const REMINDER_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hinglish' },
];

function buildHinglishReminder({ parentName, studentName, amount, daysOverdue }) {
  let text =
    'Namaste ' + parentName + ', ' + studentName + ' ki tuition fee ka ' + formatRupees(amount) +
    ' abhi baaki hai.';
  if (daysOverdue > 0) {
    text += ' Yeh ' + daysOverdue + (daysOverdue === 1 ? ' day' : ' days') + ' se overdue hai.';
  }
  text += ' Kripya ise jald se jald clear kar dein. Dhanyavaad! - Meera';
  return text;
}

export function buildReminder({ parentName, studentName, amount, daysOverdue, lang = 'en' }) {
  if (lang === 'hi') {
    return buildHinglishReminder({ parentName, studentName, amount, daysOverdue });
  }
  let text =
    'Namaste ' + parentName + ', this is a gentle reminder from Meera regarding the tuition fee for ' +
    studentName + '. An amount of ' + formatRupees(amount) + ' is pending.';
  if (daysOverdue > 0) {
    text += ' It was due ' + daysOverdue + (daysOverdue === 1 ? ' day' : ' days') + ' ago.';
  }
  text += ' Kindly clear it at your earliest convenience. Thank you!';
  return text;
}

export function whatsappLink(phone, text) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length !== 10) throw new Error('Parent phone must be a 10-digit number');
  return 'https://wa.me/91' + digits + '?text=' + encodeURIComponent(text);
}
