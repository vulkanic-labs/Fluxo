import objectPath from 'object-path';
import { templatingFunctions } from './templatingFunctions';

const refKeys: Record<string, string> = {
  table: 'table',
  dataColumn: 'table',
  dataColumns: 'table',
};

export function extractStrFunction(str: string) {
  const extractedStr = /^\$\s*(\w+)\s*\((.*)\)/.exec(
    str.trim().replace(/\r?\n|\r/g, '')
  );

  if (!extractedStr) return null;
  const { 1: name, 2: funcParams } = extractedStr;
  const params = funcParams
    .split(/,(?=(?:[^'"\\"\\']*['"][^'"]*['"\\"\\'])*[^'"]*$)/)
    .map((param) => param.trim().replace(/^['"]|['"]$/g, '') || '');

  return {
    name,
    params,
  };
}

export function keyParser(key: string, data: any) {
  let [dataKey, path] = key.split(/[@.](.+)/);

  dataKey = refKeys[dataKey] ?? dataKey;

  if (!path) return { dataKey, path: '' };

  if (dataKey !== 'table') {
    if (dataKey === 'loopData' && !path.endsWith('.$index')) {
      const pathArr = path.split('.');
      pathArr.splice(1, 0, 'data');
      path = pathArr.join('.');
    }
    return { dataKey, path };
  }

  const [firstPath, restPath] = path.split(/\.(.+)/);

  if (firstPath === '$last') {
    const lastIndex = data.table?.length - 1;
    path = `${lastIndex}.${restPath || ''}`;
  } else if (!restPath) {
    path = `0.${firstPath}`;
  } else if (typeof +firstPath !== 'number' || Number.isNaN(+firstPath)) {
    path = `0.${firstPath}.${restPath}`;
  }

  path = path.replace(/\.$/, '');
  return { dataKey: 'table', path };
}

interface ReplacerOptions {
  data: any;
  regex: RegExp;
  tagLen: number;
  modifyPath?: (path: string) => string;
  checkExistence?: boolean;
  disableStringify?: boolean;
}

function replacer(str: string, options: ReplacerOptions) {
  const { data, regex, tagLen, modifyPath, checkExistence, disableStringify } = options;
  const replaceResult: { list: Record<string, any>; value: any } = {
    list: {},
    value: str,
  };

  if (typeof str !== 'string') return replaceResult;

  replaceResult.value = str.replace(regex, (match) => {
    let key = match.slice(tagLen, -tagLen).trim();
    if (!key) return '';

    let result: any = '';
    let stringify = false;
    const isFunction = extractStrFunction(key);
    const funcRef = isFunction && (data.functions || templatingFunctions)[isFunction.name];

    if (modifyPath && !funcRef) {
      key = modifyPath(key);
    }

    if (funcRef) {
      const funcParams = isFunction.params.map((param: string) => {
        const { value, list } = replacer(param, {
          data,
          tagLen: 1,
          regex: /\[(.*?)\]/,
        });
        Object.assign(replaceResult.list, list);
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      });
      result = funcRef.apply({ refData: data }, funcParams);
    } else {
      let { dataKey, path } = keyParser(key, data);
      if (dataKey.startsWith('!')) {
        stringify = true;
        dataKey = dataKey.slice(1);
      }

      if (checkExistence) return objectPath.has(data[dataKey], path);

      result = objectPath.get(data[dataKey], path);
      if (typeof result === 'undefined') result = match;
    }

    const finalResult =
      disableStringify || (typeof result === 'string' && !stringify)
        ? result
        : JSON.stringify(result);

    const logValue = typeof finalResult === 'string' ? finalResult.slice(0, 512) : finalResult;
    replaceResult.list[match] = logValue;

    return finalResult;
  });

  return replaceResult;
}

export default async function renderString(str: string, refData: any, options = {}) {
  if (!str || typeof str !== 'string') return { value: str, list: {} };

  const data = { ...refData, functions: templatingFunctions };
  const replacedList: Record<string, any> = {};

  const result = replacer(`${str}`, {
    data,
    tagLen: 2,
    regex: /\{\{(.*?)\}\}/g,
    modifyPath: (path) => {
      const { value, list } = replacer(path, {
        data,
        tagLen: 1,
        regex: /\[(.*?)\]/g,
        ...options,
        checkExistence: false,
      });
      Object.assign(replacedList, list);
      return value;
    },
    ...options,
  });

  Object.assign(result.list, replacedList);
  return result;
}
