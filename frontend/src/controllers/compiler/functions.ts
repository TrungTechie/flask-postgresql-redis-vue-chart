const AVERAGE = (...args: number[]) => {
  if (args === undefined) {
    throw new Error('Context not found');
  }

  const sum = args.reduce((a, b) => a + b, 0);
  return (sum / args.length) || 0;
};

const NPV = (rate: number, ...args: number[]) => {
  if (rate === undefined || args === undefined || args.length === 0) {
    throw new Error('Context not found');
  }

  let npv = 0;

  for (let i = 0; i < args.length; i += 1) {
    npv += args[i] / (rate + 1) ** (i + 1);
  }

  return npv;
};

export const evalInContext = (input: string) => { // eslint-disable-line
  return eval(input); // eslint-disable-line
};
