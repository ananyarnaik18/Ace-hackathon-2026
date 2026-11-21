import { formatRupees, formatDate } from '../utils/format.js';

const W = 640;
const H = 220;
const PAD_L = 64;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 28;

function shortDate(iso) {
  return formatDate(iso).slice(0, 6);
}

// days: baseline days. compareDays (optional): what-if days drawn as a dashed second line.
export default function ForecastChart({ days, compareDays = null }) {
  if (!days.length) return null;
  const all = compareDays ? [...days, ...compareDays] : days;
  const values = all.map((d) => d.balance);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const x = (i) => PAD_L + (days.length === 1 ? 0 : (i / (days.length - 1)) * innerW);
  const y = (v) => PAD_T + ((max - v) / span) * innerH;
  const zeroY = y(0);

  const pts = (series) => series.map((d, i) => x(i).toFixed(1) + ',' + y(d.balance).toFixed(1)).join(' ');

  function negativePolys(series) {
    const runs = [];
    let run = [];
    series.forEach((d, i) => {
      if (d.balance < 0) {
        run.push(i);
      } else if (run.length) {
        runs.push(run);
        run = [];
      }
    });
    if (run.length) runs.push(run);
    return runs.map((idx) => {
      const top = idx.map((i) => x(i).toFixed(1) + ',' + y(series[i].balance).toFixed(1));
      const bottom = [...idx].reverse().map((i) => x(i).toFixed(1) + ',' + zeroY.toFixed(1));
      return [...top, ...bottom].join(' ');
    });
  }

  const basePolys = negativePolys(days);
  const whatIfPolys = compareDays ? negativePolys(compareDays) : [];

  const labelIdx = [...new Set([0, Math.floor((days.length - 1) / 2), days.length - 1])];

  return (
    <div className="chart-wrap">
      <svg className="forecast-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Running cash balance chart">
        <line x1={PAD_L} x2={W - PAD_R} y1={zeroY} y2={zeroY} stroke="#666" strokeDasharray="4 4" />
        <text x={PAD_L - 6} y={zeroY + 4} fontSize="11" textAnchor="end" fill="#666">0</text>
        <text x={PAD_L - 6} y={PAD_T + 4} fontSize="11" textAnchor="end" fill="#666">{formatRupees(max)}</text>
        <text x={PAD_L - 6} y={H - PAD_B} fontSize="11" textAnchor="end" fill="#666">{formatRupees(min)}</text>
        {basePolys.map((p, k) => (
          <polygon key={'b' + k} points={p} fill="#dc2626" fillOpacity="0.35" />
        ))}
        {whatIfPolys.map((p, k) => (
          <polygon key={'w' + k} points={p} fill="#ea580c" fillOpacity="0.25" />
        ))}
        <polyline points={pts(days)} fill="none" stroke="#0f5257" strokeWidth="2" />
        {compareDays && (
          <polyline points={pts(compareDays)} fill="none" stroke="#ea580c" strokeWidth="2" strokeDasharray="6 4" />
        )}
        {labelIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            fontSize="11"
            textAnchor={i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle'}
            fill="#666"
          >
            {shortDate(days[i].date)}
          </text>
        ))}
      </svg>
      <p className="chart-caption">
        {compareDays
          ? 'Solid teal: baseline. Dashed orange: what-if. Red and orange areas: balance below zero.'
          : 'Red area: balance below zero.'}
      </p>
    </div>
  );
}
