import { TableData } from '@/components/ui/table/types';

import { Expression } from './types';

export const preprocess = ( // eslint-disable-line
  input: any,
  data: TableData,
  value: any,
  withoutCategories = false,
): Set<Expression> | undefined => {
  if (typeof input !== 'string' || !input.startsWith('=')) {
    return input;
  }

  const source: string = input;
  const expressions = [...source.matchAll(/([a-z\.\d]+)(<[a-z\d]*>)(<[a-z\d\-\+\s]+>)?/gmi)!]; // eslint-disable-line

  const parsed: Set<Expression> = new Set();
  let column;

  for (let i = 0; i < expressions.length; i += 1) {
    const scoped = expressions[i];
    const inputCategory = scoped[2].replace(/[<>]+/g, '');
    let index;
    let category;

    if (inputCategory !== 'this') {
      category = data.categories.filter((category) => category.key === inputCategory)[0]; // eslint-disable-line

      if (scoped.length < 4 || scoped[3] === undefined || category === undefined) {
        return undefined;
      }

      const method = scoped[3].replace(/[<>]+/g, '').toLowerCase();
      const numeric = Number(method);

      if (!Number.isNaN(numeric) && numeric >= 0 && numeric <= category.values.length - 1) {
        index = numeric;
      } else if (method.startsWith('last')) {
        index = category.values.length - 1 + (Number(method.replace('last', '').replace(' ', '')) || 0);
      }
    } else if (!withoutCategories) {
      category = data.categories.filter((category) => category.values.includes(value))[0]; // eslint-disable-line

      if (category === undefined) {
        return undefined;
      }

      const scopedIndex = category.values.indexOf(value);

      if (scoped.length === 4 && scoped[3] !== undefined) {
        const method = scoped[3].replace(/[<>]+/g, '').toLowerCase();

        if (['previous', 'prev'].includes(method)) {
          index = scopedIndex - 1;
        }
      } else {
        index = scopedIndex;
      }
    } else {
      column = value;
      index = 0;
    }

    if (index === undefined || index < 0) {
      return undefined;
    }

    let expression: Expression;

    if (withoutCategories) {
      if (column === undefined) {
        return undefined;
      }

      expression = {
        input: scoped[0],
        variable: scoped[1],
        index,
        category,
        column,
      };
    } else {
      if (category === undefined) {
        return undefined;
      }

      expression = {
        input: scoped[0],
        variable: scoped[1],
        index,
        category,
        column: category.values[index],
      };
    }

    parsed.add(expression);
  }

  return parsed;
};
