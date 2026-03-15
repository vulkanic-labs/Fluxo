import { JSONPath } from 'jsonpath-plus';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const isAllNums = (...args: any[]) => args.every((arg) => !Number.isNaN(+arg));
const isObject = (obj: any) =>
  typeof obj === 'object' && obj !== null && !Array.isArray(obj);

function parseJSON(data: string, def: any) {
  try {
    return JSON.parse(data);
  } catch (error) {
    return def;
  }
}

export const templatingFunctions: Record<string, Function> = {
  date(...args: any[]) {
    let date = new Date();
    let dateFormat = 'DD-MM-YYYY';

    if (args.length === 1) {
      dateFormat = args[0];
    } else if (args.length >= 2) {
      date = new Date(args[0]);
      dateFormat = args[1];
    }

    const isValidDate = date instanceof Date && !isNaN(date.getTime());
    const dayjsDate = dayjs(isValidDate ? date : Date.now());

    let result: string | number = dayjsDate.format(dateFormat);

    if (dateFormat === 'relative') result = dayjsDate.fromNow();
    else if (dateFormat === 'timestamp') result = dayjsDate.valueOf();

    return result;
  },
  randint(min = 0, max = 100) {
    return Math.round(Math.random() * (+max - +min) + +min);
  },
  getLength(str: any) {
    const value = typeof str === 'string' ? parseJSON(str, str) : str;
    return value?.length ?? (value !== undefined ? 1 : 0);
  },
  slice(value: any, start: any, end: any) {
    if (!value || !value.slice) return value;
    const startIndex = Number.isNaN(+start) ? 0 : +start;
    const endIndex = Number.isNaN(+end) ? value.length : +end;
    return value.slice(startIndex, endIndex);
  },
  multiply(value: any, multiplyBy: any) {
    if (!isAllNums(value, multiplyBy)) return value;
    return +value * +multiplyBy;
  },
  increment(value: any, incrementBy: any) {
    if (!isAllNums(value, incrementBy)) return value;
    return +value + +incrementBy;
  },
  divide(value: any, divideBy: any) {
    if (!isAllNums(value, divideBy)) return value;
    return +value / +divideBy;
  },
  subtract(value: any, subtractBy: any) {
    if (!isAllNums(value, subtractBy)) return value;
    return +value - +subtractBy;
  },
  randData(str: any) {
    if (Array.isArray(str)) {
      const index = Math.floor(Math.random() * str.length);
      return str[index];
    }

    const getRand = (data: string | any[]) => data[Math.floor(Math.random() * data.length)];
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const symbols = `!@#$%^&*()-_+={}[]|\\;:'"<>,./?"`;
    
    const mapSamples: Record<string, () => any> = {
      l: () => getRand(lowercase),
      u: () => getRand(uppercase),
      d: () => getRand(digits),
      s: () => getRand(symbols),
      f() { return this.l() + this.u(); },
      n() { return this.l() + this.d(); },
      m() { return this.u() + this.d(); },
      i() { return this.l() + this.u() + this.d(); },
      a() { return getRand(lowercase + uppercase + digits.join('') + symbols); },
    };

    return `${str}`.replace(
      /\?[a-zA-Z]/g,
      (char) => mapSamples[char.at(-1)!]?.() ?? char
    );
  },
  filter(data: any, exps: string) {
    if (!isObject(data) && !Array.isArray(data)) return data;
    return JSONPath({ path: exps, json: data });
  },
  replace(value: string, search: string | RegExp, replaceValue: string) {
    if (!value) return value;
    return value.replace(search, replaceValue);
  },
  replaceAll(value: string, search: string, replaceValue: string) {
    if (!value) return value;
    // @ts-ignore
    return value.replaceAll ? value.replaceAll(search, replaceValue) : value.split(search).join(replaceValue);
  },
  toLowerCase(value: string) {
    if (!value) return value;
    return value.toLowerCase();
  },
  toUpperCase(value: string) {
    if (!value) return value;
    return value.toUpperCase();
  },
  modulo(value: any, divisor: any) {
    return +value % +divisor;
  },
  stringify(value: any) {
    return JSON.stringify(value);
  },
};
