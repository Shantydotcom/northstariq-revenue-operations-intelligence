/** Colour is a reading aid, never the only signal — the number is always shown. */
export function meterClass(score: number): string {
  if (score < 70) return 'bad';
  if (score < 90) return 'warn';
  return '';
}

export default function ScoreMeter({ score }: { score: number }) {
  return (
    <div className="meter" role="presentation">
      <span className={meterClass(score)} style={{ width: `${score}%` }} />
    </div>
  );
}
