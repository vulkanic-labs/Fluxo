import objectPath from 'object-path';
import cloneDeep from 'lodash.clonedeep';
import renderString from './renderString';

interface TemplateOptions {
  block: any;
  refKeys?: string[];
  data: any;
}

export default async function templateBlock({ block, refKeys, data }: TemplateOptions) {
  if (!refKeys || refKeys.length === 0) return block;

  const copyBlock = cloneDeep(block);
  
  if (!copyBlock.replacedValue) copyBlock.replacedValue = {};

  const addReplacedValue = (value: Record<string, any>) => {
    copyBlock.replacedValue = { ...copyBlock.replacedValue, ...value };
  };

  for (const blockDataKey of refKeys) {
    const currentData = objectPath.get(copyBlock.data, blockDataKey);
    if (!currentData) continue;

    if (Array.isArray(currentData)) {
      for (let index = 0; index < currentData.length; index += 1) {
        const value = currentData[index];
        const renderedValue = await renderString(value, data);

        addReplacedValue(renderedValue.list);
        objectPath.set(
          copyBlock.data,
          `${blockDataKey}.${index}`,
          renderedValue.value
        );
      }
    } else if (typeof currentData === 'string') {
      const renderedValue = await renderString(currentData, data);

      addReplacedValue(renderedValue.list);
      objectPath.set(copyBlock.data, blockDataKey, renderedValue.value);
    }
  }

  return copyBlock;
}
