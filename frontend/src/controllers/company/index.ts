import { reactive, computed, ref } from 'vue';

import {
  Company,
  FinancialResponse,
  Financial as FinancialSchema,
  Forecast,
  ForecastField,
  ForecastValue,
} from '@/rest-api/companies/assets';
import * as api from '@/rest-api/companies';

import { Comment } from '@/rest-api/comments/assets';
import * as commentApi from '@/rest-api/comments';

import { CompanyController } from './types';
import {
  financialFormulas,
  firstProjectedFormulas,
  projectedFormulas,
  estimatedFormulas,
  averageFormulas,
  emptyData,
  emptyValuation,
  emptyFinancials,
} from './data';

const useCompany = (symbol: string): CompanyController => {
  const data = reactive(emptyData);
  const valuation = reactive(emptyValuation);
  const financials = reactive(emptyFinancials);
  const ceo = reactive([]);
  const forecasts: Forecast[] = reactive([]);
  const selectedForecast = ref<number | undefined>();
  const comments: Comment[] = reactive([]);

  let financialResponse: FinancialResponse;
  const currentYear = new Date().getFullYear();

  const getValueByKey = (
    key: string,
    average: any,
    forecast?: ForecastValue,
  ): any => (forecast && forecast[key] ? forecast[key] : average[key]);

  const forecast = computed(() => {
    if (selectedForecast.value !== undefined && forecasts[selectedForecast.value] !== undefined) {
      return forecasts[selectedForecast.value];
    }
    return undefined;
  });

  const updateFinancials = () => {
    const actual: FinancialSchema[] = [];
    const average: FinancialSchema[] = [averageFormulas as any]; // eslint-disable-line
    const terminal: FinancialSchema[] = []; // eslint-disable-line
    const estimated: FinancialSchema[] = [];
    const projected: FinancialSchema[] = [];

    financialResponse.financials.forEach((financial) => {
      actual.push(Object.assign(financial, financialFormulas));
    });

    let estimatedYear = actual[actual.length - 1]?.year as number;

    if (estimatedYear === undefined) {
      estimatedYear = currentYear + 1;
    } else {
      estimatedYear += 1;
    }

    const estimatedForecast = forecast.value && forecast.value.values[estimatedYear];
    const estimatedFinancial = { ...estimatedFormulas };

    estimatedFinancial.year = estimatedYear;
    estimatedFinancial.revenueChange = getValueByKey('revenueChange', estimatedFormulas, estimatedForecast);
    estimatedFinancial.margin = getValueByKey('margin', estimatedFormulas, estimatedForecast);
    estimatedFinancial.percentageCfoOfRevenue = getValueByKey('percentageCfoOfRevenue', estimatedFormulas, estimatedForecast);
    estimatedFinancial.capexChange = getValueByKey('capexChange', estimatedFormulas, estimatedForecast);
    estimatedFinancial.totalAssetsChange = getValueByKey('totalAssetsChange', estimatedFormulas, estimatedForecast);
    estimatedFinancial.percentageLiabilitiesOfAssets = getValueByKey('percentageLiabilitiesOfAssets', estimatedFormulas, estimatedForecast);
    estimatedFinancial.sharesOutstandingChange = getValueByKey('sharesOutstandingChange', estimatedFormulas, estimatedForecast);
    estimatedFinancial.requiredReturn = Number(localStorage.getItem(`${data.symbol}:requiredReturn`)) || 10;
    estimatedFinancial.freeCashFlowGrowthRate = Number(localStorage.getItem(`${data.symbol}:freeCashFlowGrowthRate`)) || 0;

    estimated.push(estimatedFinancial as any);

    for (let i = estimatedYear + 1; i < currentYear + 7; i += 1) {
      const projectedFinancial: any = {
        ...(i === estimatedYear + 1 ? firstProjectedFormulas : projectedFormulas),
      };

      projectedFinancial.year = i === estimatedYear + 5 ? 'Terminal' : i;

      const currentForecast = forecast.value && forecast.value.values[projectedFinancial.year];

      projectedFinancial.revenueChange = getValueByKey('revenueChange', average[0], currentForecast);
      projectedFinancial.margin = getValueByKey('margin', average[0], currentForecast);
      projectedFinancial.percentageCfoOfRevenue = getValueByKey('percentageCfoOfRevenue', average[0], currentForecast);
      projectedFinancial.capexChange = getValueByKey('capexChange', average[0], currentForecast);
      projectedFinancial.totalAssetsChange = getValueByKey('totalAssetsChange', average[0], currentForecast);
      projectedFinancial.percentageLiabilitiesOfAssets = getValueByKey('percentageLiabilitiesOfAssets', average[0], currentForecast);
      projectedFinancial.sharesOutstandingChange = getValueByKey('sharesOutstandingChange', average[0], currentForecast);

      projectedFinancial.pvBreakdown = `=freeCashFlow<this>/(1+requiredReturn<estimated><last>/100)**${i - estimatedYear + 1}`;

      if (projectedFinancial.year === estimatedYear + 1) {
        projectedFinancial.enterpriseValue = '=NPV(requiredReturn<estimated><last>/100,freeCashFlow<projected><0>:freeCashFlow<projected><last-1>)+terminalValue<projected><last>/(1+requiredReturn<estimated><last>/100)**4+freeCashFlow<estimated><last>';
      } else if (projectedFinancial.year === estimatedYear + 2) {
        projectedFinancial.enterpriseValue = '=NPV(requiredReturn<estimated><last>/100,freeCashFlow<projected><1>:freeCashFlow<projected><last-1>)+terminalValue<projected><last>/(1+requiredReturn<estimated><last>/100)**3+freeCashFlow<projected><0>+freeCashFlow<estimated><last>*(1+requiredReturn<estimated><last>/100)';
      } else if (projectedFinancial.year === estimatedYear + 3) {
        projectedFinancial.enterpriseValue = '=NPV(requiredReturn<estimated><last>/100,freeCashFlow<projected><2>:freeCashFlow<projected><last-1>)+terminalValue<projected><last>/(1+requiredReturn<estimated><last>/100)**2+freeCashFlow<projected><1>+freeCashFlow<projected><0>*(1+requiredReturn<estimated><last>/100)+freeCashFlow<estimated><last>*(1+requiredReturn<estimated><last>/100)**2';
      } else if (projectedFinancial.year === estimatedYear + 4) {
        projectedFinancial.enterpriseValue = '=NPV(requiredReturn<estimated><last>/100,freeCashFlow<projected><3>:freeCashFlow<projected><last-1>)+terminalValue<projected><last>/(1+requiredReturn<estimated><last>/100)+freeCashFlow<projected><2>+freeCashFlow<projected><1>*(1+requiredReturn<estimated><last>/100)+freeCashFlow<projected><0>*(1+requiredReturn<estimated><last>/100)**2+freeCashFlow<estimated><last>*(1+requiredReturn<estimated><last>/100)**3';
      }

      if (i === estimatedYear + 5) {
        projectedFinancial.terminalValue = '=freeCashFlow<this>/(requiredReturn<estimated><last>/100-freeCashFlowGrowthRate<estimated><last>/100)';
        projectedFinancial.pvBreakdown = '=terminalValue<this>/(1+requiredReturn<estimated><last>/100)**5';
      } else {
        projectedFinancial.netDebtEstimate = 0;
        projectedFinancial.minorityInterest = 0;
        projectedFinancial.preferredStock = 0;
        projectedFinancial.averageMarketCap = '=enterpriseValue<this>+netDebtEstimate<this>+preferredStock<this>+minorityInterest<this>';
        projectedFinancial.averageStockPrice = '=averageMarketCap<this>/sharesOutstanding<this>';
      }

      projected.push(projectedFinancial);
    }

    Object.assign(ceo, financialResponse.ceo);

    Object.assign(financials, {
      actual,
      average,
      terminal,
      estimated,
      projected,
    });
  };

  const updatePrimaryData = (): Promise<Company> => new Promise((resolve, reject) => {
    api.get(symbol).then((payload) => {
      Object.assign(data, payload);
      resolve(payload);
    }).catch((error) => {
      reject(error);
    });
  });

  const update = (): Promise<undefined> => new Promise((resolve, reject) => {
    if (symbol === undefined) {
      reject(new Error('useCompany() -> update() available only if the company\'s symbol has been passed'));
      return;
    }

    updatePrimaryData().then((payload) => {
      Object.assign(data, payload);

      api.valuation(symbol).then((payload) => {
        Object.assign(valuation, payload);
      });

      commentApi.get(symbol).then((payload) => {
        Object.assign(comments, payload);
      });

      api.forecasts(symbol).then((payload) => {
        Object.assign(forecasts, payload);
      }).finally(() => {
        api.financials(symbol).then((payload) => {
          financialResponse = payload;
          updateFinancials();
        });
      });

      resolve(undefined);
    }).catch((error) => {
      reject(error);
    });
  });

  const createForecast = (name: string) => new Promise<Forecast>((resolve, reject) => {
    api.createForecast(symbol, name).then((payload) => {
      forecasts.push(payload);
      selectedForecast.value = forecasts.length - 1;
      updateFinancials();
      resolve(payload);
    }).catch((error) => {
      reject(error);
    });
  });

  const setForecast = (newForecast?: Forecast) => {
    if (newForecast === undefined) {
      selectedForecast.value = undefined;
    } else {
      const index = forecasts.indexOf(newForecast);
      if (index >= 0) {
        selectedForecast.value = index;
      }
    }
    updateFinancials();
  };

  const saveForecast = (column: string, field: string, value: number) => {
    if (forecast.value === undefined) {
      return;
    }

    const payload: ForecastField = {};
    payload[column] = {};
    payload[column][field] = value;

    forecasts.forEach((x) => {
      if (forecast.value?.id === x.id) {
        const currentForecast = x;

        if (!currentForecast.values[column]) {
          currentForecast.values[column] = {};
        }

        currentForecast.values[column][field] = value;
      }
    });

    api.saveForecast(symbol, forecast.value.id, payload);
  };

  const getChartData = (period: string) => api.chart(symbol, period);

  const addComment = (comment: Comment) => {
    comments.unshift(comment);
  };

  const saveComment = (index: number) => {
    const comment = comments[index];

    if (comment === undefined || !comment.text) {
      return;
    }

    if (comment.id === undefined) {
      commentApi.create(
        symbol,
        comment.field,
        comment.column && comment.column.toString(),
        comment.title,
        comment.text,
      ).then((payload) => {
        Object.assign(comment, payload);
      });
    } else {
      commentApi.update(comment.id, comment.title, comment.text);
    }
  };

  const deleteComment = (index: number) => {
    const comment = comments[index];

    if (comment === undefined) {
      return;
    }

    if (comment.id !== undefined) {
      commentApi.remove(comment.id);
    }

    comments.splice(index, 1);
  };

  return {
    data,
    valuation,
    financials,
    forecasts,
    forecast,
    ceo,
    comments,
    updatePrimaryData,
    update,
    getChartData,
    createForecast,
    setForecast,
    saveForecast,
    addComment,
    saveComment,
    deleteComment,
  };
};

export {
  useCompany, // eslint-disable-line
};
