import type { CareTask } from './care-tasks';
import { addDays } from './dates';
import { planReminders } from './reminders';
import type { Task } from './schedule';

const TODAY = '2031-06-10';
/** 8:00 that morning; reminders are set for 9:00. */
const NOW = new Date(2031, 5, 10, 8, 0).getTime();
const NINE = 9 * 60;

/** Only the fields planning reads. */
function task(name: string, days: number, kind: Task = 'water'): CareTask {
  return { plant: { id: name }, name, task: kind, label: null, days } as unknown as CareTask;
}

const dates = (tasks: CareTask[], now = NOW) =>
  planReminders(tasks, TODAY, NINE, now).map((p) => p.date);
const day = (offset: number) => addDays(TODAY, offset);

test('an overdue plant comes up again every day for two weeks', () => {
  const plans = planReminders([task('Fern', -2)], TODAY, NINE, NOW);
  expect(plans.map((p) => p.date)).toEqual(Array.from({ length: 14 }, (_, i) => day(i)));
  expect(plans.every((p) => p.body === 'Water: Fern' && p.water)).toBe(true);
  // Once today's time has passed, it starts tomorrow.
  expect(dates([task('Fern', -2)], NOW + 2 * 3_600_000)[0]).toBe(day(1));
});

test('quiet days before anything is due get no reminder', () => {
  expect(dates([task('Fern', 3)])).toEqual(Array.from({ length: 11 }, (_, i) => day(i + 3)));
  expect(dates([])).toEqual([]);
});

test('further ahead, only days when something new comes due, up to a year', () => {
  const tasks = [task('Fern', 40), task('Palm', 200, 'repot'), task('Fig', 400, 'prune')];
  const plans = planReminders(tasks, TODAY, NINE, NOW);
  expect(plans.map((p) => p.date)).toEqual([day(40), day(200)]);
  // By then the fern is still waiting too (nothing was done in between).
  expect(plans[1].body).toBe('Water: Fern · Repot: Palm');
  expect(plans[1].title).toBe('2 plants could use some care');
});

test('nudges now and new arrivals later go together', () => {
  const planned = dates([task('Fern', 0), task('Palm', 30, 'fertilize')]);
  expect(planned).toHaveLength(15);
  expect(planned.at(-1)).toBe(day(30));
});

test('no more than fifty reminders are kept scheduled, the soonest ones', () => {
  const tasks = Array.from({ length: 80 }, (_, i) => task(`Plant ${i}`, 20 + i));
  const planned = dates(tasks);
  expect(planned).toHaveLength(50);
  expect(planned[0]).toBe(day(20));
  expect(planned.at(-1)).toBe(day(69));
});
