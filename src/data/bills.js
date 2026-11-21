export function validateBill({ name, amount, dueDay }) {
  const cleanName = String(name ?? '').trim();
  if (!cleanName) throw new Error('Bill name is required');
  if (!Number.isInteger(Number(amount)) || Number(amount) <= 0) {
    throw new Error('Amount must be a whole rupee amount above 0');
  }
  if (!Number.isInteger(Number(dueDay)) || Number(dueDay) < 1 || Number(dueDay) > 28) {
    throw new Error('Due day must be between 1 and 28');
  }
  return { name: cleanName, amount: Number(amount), dueDay: Number(dueDay) };
}

export function addBill(data, input) {
  const clean = validateBill(input);
  const bill = {
    id: 'rb-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    ...clean,
  };
  return { ...data, recurringBills: [...data.recurringBills, bill] };
}

export function updateBill(data, id, input) {
  const clean = validateBill(input);
  if (!data.recurringBills.some((b) => b.id === id)) throw new Error('Bill not found');
  return {
    ...data,
    recurringBills: data.recurringBills.map((b) => (b.id === id ? { ...b, ...clean } : b)),
  };
}

export function deleteBill(data, id) {
  if (!data.recurringBills.some((b) => b.id === id)) throw new Error('Bill not found');
  return { ...data, recurringBills: data.recurringBills.filter((b) => b.id !== id) };
}
