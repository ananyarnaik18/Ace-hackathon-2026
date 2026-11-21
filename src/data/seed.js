const BATCHES = ['Class 8 Maths', 'Class 9 Maths & Science', 'Class 10 Maths', 'Class 10 Science'];

const NAMES = [
  'Aarav Sharma', 'Diya Verma', 'Kabir Singh', 'Ananya Gupta', 'Vihaan Mishra',
  'Ishita Pandey', 'Reyansh Tiwari', 'Saanvi Dubey', 'Arjun Yadav', 'Myra Srivastava',
  'Advik Joshi', 'Anika Rao', 'Shaurya Nair', 'Pari Chauhan', 'Dhruv Kulkarni',
  'Riya Bhatt', 'Yuvan Malhotra', 'Tara Agarwal', 'Ishan Saxena', 'Kiara Mehta',
];

const PARENTS = [
  'Rakesh Sharma', 'Sunita Verma', 'Harpreet Singh', 'Neha Gupta', 'Suresh Mishra',
  'Pooja Pandey', 'Manoj Tiwari', 'Rekha Dubey', 'Ramesh Yadav', 'Anjali Srivastava',
  'Deepak Joshi', 'Kavita Rao', 'Prakash Nair', 'Meenal Chauhan', 'Vijay Kulkarni',
  'Sangeeta Bhatt', 'Ajay Malhotra', 'Rina Agarwal', 'Sanjay Saxena', 'Priya Mehta',
];

const OVERDUE_DAYS = [3, 9, 15, 22, 40];

function pad(n, width = 2) {
  return String(n).padStart(width, '0');
}

function monthKey(year, monthIndex) {
  const d = new Date(year, monthIndex, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function toIso(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function buildSeed(today = new Date()) {
  const year = today.getFullYear();
  const monthIndex = today.getMonth();
  const todayDay = today.getDate();
  const curMonth = monthKey(year, monthIndex);
  const prevMonth = monthKey(year, monthIndex - 1);
  const daysAgo = (n) => toIso(new Date(year, monthIndex, todayDay - n));
  const dueIn = (month, day) => `${month}-${pad(day)}`;
  // dueDay is kept >= today's date so current-month invoices are not overdue
  const lo = Math.min(todayDay, 28);

  const students = NAMES.map((name, i) => ({
    id: `s${i + 1}`,
    name,
    parentName: PARENTS[i],
    parentPhone: `987650${pad(i + 1, 4)}`,
    batch: BATCHES[Math.floor(i / 5)],
    monthlyFee: 1000 + 50 * ((i * 7) % 31),
    dueDay: lo + (i % (29 - lo)),
  }));

  const invoices = [];
  const payments = [];

  const addInvoice = (s, month, dueDate, status, amountPaid, payDate, method) => {
    const id = `inv-${s.id}-${month}`;
    invoices.push({
      id,
      studentId: s.id,
      month,
      amount: s.monthlyFee,
      issueDate: `${month}-01`,
      dueDate,
      status,
      amountPaid,
    });
    if (amountPaid > 0) {
      payments.push({
        id: `pay-${payments.length + 1}`,
        invoiceId: id,
        amount: amountPaid,
        date: payDate,
        method,
      });
    }
  };

  students.forEach((s, i) => {
    const amt = s.monthlyFee;
    const method = i % 3 === 0 ? 'cash' : 'upi';

    // Previous month: students 0-4 are the 5 overdue invoices (student 2 partly paid);
    // everyone else is fully paid.
    if (i < 5) {
      const partial = i === 2 ? amt / 2 : 0;
      addInvoice(s, prevMonth, daysAgo(OVERDUE_DAYS[i]), 'sent', partial, dueIn(prevMonth, 5), method);
    } else {
      addInvoice(s, prevMonth, dueIn(prevMonth, s.dueDay), 'paid', amt, dueIn(prevMonth, s.dueDay), method);
    }

    // Current month: 9 paid, 4 partly paid, 2 draft, 5 unpaid sent.
    const payDate = dueIn(curMonth, Math.max(1, todayDay - (i % 3)));
    const dueDate = dueIn(curMonth, s.dueDay);
    if (i < 5 || (i >= 11 && i <= 14)) {
      addInvoice(s, curMonth, dueDate, 'paid', amt, payDate, method);
    } else if (i <= 8) {
      addInvoice(s, curMonth, dueDate, 'sent', amt / 2, payDate, method);
    } else if (i <= 10) {
      addInvoice(s, curMonth, dueDate, 'draft', 0, payDate, method);
    } else {
      addInvoice(s, curMonth, dueDate, 'sent', 0, payDate, method);
    }
  });

  const recurringBills = [
    { id: 'rb1', name: 'Rent', amount: 8000, dueDay: 1 },
    { id: 'rb2', name: 'Internet', amount: 999, dueDay: 5 },
    { id: 'rb3', name: 'Study materials', amount: 1500, dueDay: 10 },
  ];

  return { students, invoices, payments, recurringBills };
}
