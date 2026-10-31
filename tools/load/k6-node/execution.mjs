import { context } from './state.mjs';
export default { get vu() { return { idInTest: context.getStore()?.vu ?? 0, iterationInScenario: 0 }; } };
