import { Ref } from 'vue';

import { TableData } from '@/components/ui/table/types';
import { nestedKey } from '@/services/nested-key';

import { sha256 } from 'js-sha256';

import { preprocess } from './preprocessor';
import { Expression, Cache } from './types';
import { evalInContext } from './functions';

export const useCompiler = (data: Ref<TableData>, withoutCategories = false) => { // eslint-disable-line
  const cache: Cache = {};

  const getCacheHash = (input: any, expression: Set<Expression>): string => {
    const dump = `${input} ${JSON.stringify([...expression].map((x) => ([x.index, x.category && x.category.key, JSON.stringify(x.column)].join(' '))))}`;
    return sha256(dump);
  };

  const getCached = (input: any, expression: Set<Expression>): string | number => {
    const hash = getCacheHash(input, expression);
    return cache[hash];
  };

  const cacheResult = (input: any, expression: Set<Expression>, result: string | number) => {
    const hash = getCacheHash(input, expression);
    cache[hash] = result;
  };

  const compile = (input: any, context: any) => {
    const expressions = preprocess(input, data.value, context, withoutCategories);

    if (!(expressions instanceof Set)) {
      return expressions;
    }

    const cached = getCached(input, expressions);

    if (cached) {
      return cached;
    }

    let output = input.replace('=', '');

    const callable = [...input.matchAll(/([a-z]+)\(([a-z<>\d\-\+:\,\/]+)\)/gmi)!];  // eslint-disable-line

    for (let i = 0; i < callable.length; i += 1) {
      const method = callable[i];

      const name = method[1];
      const args = method[2];

      const methodContext: (string | number)[] = [];

      const params = args.split(',');

      for (let y = 0; y < params.length; y += 1) {
        const param = params[y];

        if (param.includes(':')) {
          const parsed = param.split(':');

          if (parsed.length !== 2) {
            return undefined;
          }

          const methodExpressions = [...expressions].filter(
            (expression) => parsed.includes(expression.input),
          );

          if (
            methodExpressions.length !== 2
            || methodExpressions[0].category !== methodExpressions[1].category
            || methodExpressions[0].index === undefined
            || methodExpressions[1].index === undefined
            || methodExpressions[0].index > methodExpressions[1].index
            || methodExpressions[0].variable !== methodExpressions[1].variable
          ) {
            return undefined;
          }

          const expression = methodExpressions[0];
          const values = [];

          for (let x = expression.index as number; x <= methodExpressions[1].index; x += 1) {
            if (expression.category === undefined) {
              continue;
            }

            const value = compile(`=${expression.variable}<${expression.category.key}><${x}>`, expression.column);

            if (value === undefined) {
              continue;
            }

            values.push(value);
          }

          if (values.length === 0) {
            return undefined;
          }

          methodContext.push(...values);
        } else {
          const value = compile(`=${param}`, context);

          if (value === undefined) {
            return undefined;
          }

          methodContext.push(value);
        }
      }

      const methodCompiledContext = methodContext.join(',');

      let result;

      try {
        result = evalInContext(`${name}(${methodCompiledContext})`) as any;
      } catch {
        return undefined;
      }

      output = output.replace(method[0], result);
    }

    expressions.forEach((expression) => {
      let variable: string;
      if (withoutCategories) {
        variable = nestedKey(expression.variable, expression.column);
      } else {
        variable = expression.column[expression.variable];
      }
      const value = compile(variable, expression.column);
      output = output.replace(expression.input, value);
    });

    let result: string | number;

    try {
      result = evalInContext(output) as any;
    } catch {
      return undefined;
    }

    if (result === undefined) {
      return undefined;
    }

    result = Math.floor((result as number) * 100) / 100;

    cacheResult(input, expressions, result);

    return result;
  };

  const clearCache = () => {
    Object.keys(cache).map((key) => delete cache[key]);
  };

  return {
    compile,
    clearCache,
  };
};
