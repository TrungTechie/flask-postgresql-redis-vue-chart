import { ComputedRef } from 'vue'

import {
  Company,
  ValuationAndEarnings,
  Chart,
  CEO,
  Forecast,
} from '@/rest-api/companies/assets';

import { Comment } from '@/rest-api/comments/assets';

import { Financials } from './financials';

export interface CompanyController {
  data: Company;
  valuation: ValuationAndEarnings;
  financials: Financials;
  forecasts: Forecast[];
  forecast: ComputedRef<Forecast | undefined>;
  ceo: CEO[];
  comments: Comment[];
  updatePrimaryData(): Promise<Company>;
  update(): Promise<undefined>;
  getChartData(period: string): Promise<Chart>;
  createForecast(name: string): Promise<Forecast>;
  setForecast(forecast?: Forecast): void;
  saveForecast(column: string, field: string, value: number): void;
  addComment(comment: Comment): void;
  saveComment(index: number): void;
  deleteComment(index: number): void;
}
