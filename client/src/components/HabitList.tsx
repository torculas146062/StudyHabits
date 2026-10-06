import { useStudy } from '../context/StudyContext';
import { habitStatusOn, habitsOn, isRestDay } from '../study/selectors';
import { SUBJECT_GOAL_FALLBACK } from '../study/types';
import { EmptyState } from './EmptyState';
import { HabitListItem } from './HabitListItem';

type HabitListProps = {
  date: string;
};

/**
 * The habits scheduled for a date, with the tick, skip and undo actions. Shared
 * by the dashboard and the to-do screen, which show the same list.
 */
export function HabitList({ date }: HabitListProps) {
  const { data, logSession, clearHabitSession } = useStudy();
  const planned = habitsOn(data, date);
  const rest = isRestDay(data, date);

  if (!planned.length) {
    return (
      <EmptyState
        icon={rest ? 'weather-night' : 'sprout-outline'}
        title={rest ? 'A planned rest day' : 'Nothing scheduled today'}
        detail={
          rest
            ? 'Habits pause on a rest day. Enjoy the breathing room.'
            : 'Add a habit to give today a shape.'
        }
      />
    );
  }

  return (
    <>
      {planned.map((habit) => {
        const subject = data.subjects.find(
          (item) => item.id === habit.subjectId
        );

        return (
          <HabitListItem
            key={habit.id}
            title={habit.title}
            subjectName={subject?.name ?? 'Removed subject'}
            subjectIndex={Math.max(
              0,
              data.subjects.findIndex((item) => item.id === habit.subjectId)
            )}
            status={habitStatusOn(data.sessions, habit.id, date)}
            onDone={() =>
              logSession({
                subjectId: habit.subjectId,
                minutes: subject?.goalMinutes ?? SUBJECT_GOAL_FALLBACK,
                status: 'done',
                habitId: habit.id,
              })
            }
            onSkip={() =>
              logSession({
                subjectId: habit.subjectId,
                minutes: 0,
                status: 'skipped',
                habitId: habit.id,
              })
            }
            onClear={() => clearHabitSession(habit.id)}
          />
        );
      })}
    </>
  );
}
