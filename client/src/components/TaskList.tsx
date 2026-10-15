import { useStudy } from '../context/StudyContext';
import { taskStatusOn, tasksOn, isRestDay } from '../study/selectors';
import { SUBJECT_GOAL_FALLBACK } from '../study/types';
import { EmptyState } from './EmptyState';
import { TaskListItem } from './TaskListItem';

type TaskListProps = {
  date: string;
};

/**
 * The tasks scheduled for a date, with the tick, skip and undo actions. Shared
 * by the dashboard and the tasks screen, which show the same list.
 */
export function TaskList({ date }: TaskListProps) {
  const { data, logSession, clearTaskSession } = useStudy();
  const planned = tasksOn(data, date);
  const rest = isRestDay(data, date);

  if (!planned.length) {
    return (
      <EmptyState
        icon={rest ? 'weather-night' : 'sprout-outline'}
        title={rest ? 'A planned rest day' : 'Nothing scheduled today'}
        detail={
          rest
            ? 'Tasks pause on a rest day. Enjoy the breathing room.'
            : 'Add a task to give today a shape.'
        }
      />
    );
  }

  return (
    <>
      {planned.map((task) => {
        const subject = data.subjects.find(
          (item) => item.id === task.subjectId
        );
        const minutes =
          task.minutes ?? subject?.goalMinutes ?? SUBJECT_GOAL_FALLBACK;

        return (
          <TaskListItem
            key={task.id}
            title={task.title}
            subjectName={subject?.name ?? 'Removed subject'}
            subjectIndex={Math.max(
              0,
              data.subjects.findIndex((item) => item.id === task.subjectId)
            )}
            time={task.reminderTime}
            minutes={minutes}
            status={taskStatusOn(data.sessions, task.id, date)}
            isTimer={task.timer}
            onDone={() =>
              logSession({
                subjectId: task.subjectId,
                minutes,
                status: 'done',
                taskId: task.id,
                eventId: task.eventId,
              })
            }
            onSkip={() =>
              logSession({
                subjectId: task.subjectId,
                minutes: 0,
                status: 'skipped',
                taskId: task.id,
                eventId: task.eventId,
              })
            }
            onClear={() => clearTaskSession(task.id)}
          />
        );
      })}
    </>
  );
}
