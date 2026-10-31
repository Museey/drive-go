import { metric } from './state.mjs';
const kind = type => class { constructor(name, time = false) { this.m = metric(name, type, time); } add(v) { this.m.add(v); } };
export const Trend = kind('trend');
export const Counter = kind('counter');
export const Rate = kind('rate');
export const Gauge = kind('trend');
