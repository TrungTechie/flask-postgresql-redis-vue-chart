import { TableCategory } from '@/components/ui/table/types';

interface Expression {
  input: string;
  variable: string;
  index?: number;
  category?: TableCategory;
  column: any;
}

interface Cache {
  [key: string]: string | number;
}

export {
  Expression,
  Cache,
};
