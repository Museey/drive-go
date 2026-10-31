import { metric } from './state.mjs';
export function check(value, sets) {
  let all = true;
  for (const fn of Object.values(sets)) { const ok = !!fn(value); metric('checks', 'rate').add(ok); all &&= ok; }
  return all;
}
export const sleep = () => { throw new Error('k6-node: use await with k6/timers instead of sleep'); };
export default { check, sleep };
