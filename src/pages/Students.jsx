import { useTuitionData } from '../data/store.js';
import { formatRupees } from '../utils/format.js';

export default function Students() {
  const [data] = useTuitionData();

  return (
    <section>
      <p className="count">{data.students.length} students</p>
      {data.students.map((s) => (
        <article className="student-card" key={s.id}>
          <h3>{s.name}</h3>
          <p>Parent: {s.parentName}</p>
          <p>Phone: {s.parentPhone}</p>
          <p>Batch: {s.batch}</p>
          <p>Monthly fee: {formatRupees(s.monthlyFee)}</p>
          <p>Due day: {s.dueDay}</p>
        </article>
      ))}
    </section>
  );
}
