import TaskCard from './TaskCard.jsx';

const WEEK_MON_FIRST = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeekCalendar({ tasksByDay, onComplete, onMoveDay, onDurationChange, busy }) {
  return (
    <div className="grid gap-4 lg:grid-cols-7">
      {WEEK_MON_FIRST.map((day) => {
        const list = (tasksByDay && tasksByDay[day]) || [];
        return (
          <div
            key={day}
            className="flex min-h-[12rem] flex-col rounded-2xl border border-neutral-200/90 bg-white/90 p-3 shadow-sm"
          >
            <div className="mb-3 border-b border-neutral-100 pb-2">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-emerald">{day}</p>
              <p className="text-[11px] text-neutral-500">{list.length} block{list.length === 1 ? '' : 's'}</p>
            </div>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
              {list.length === 0 && (
                <p className="text-xs italic text-neutral-400">Rest or catch-up — no tasks scheduled.</p>
              )}
              {list.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onComplete={onComplete}
                  onMoveDay={onMoveDay}
                  onDurationChange={onDurationChange}
                  busy={busy}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
