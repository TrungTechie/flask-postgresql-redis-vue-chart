<template>
  <Card class="company-header">
    <div class="company-title">
      <h2>{{ company.data.name }}</h2>
      <p>{{ company.data.shortName }}</p>
    </div>
    <div class="company-price">
      <div class="company-price-row">
        <p style="font-weight: 600;">Stock price</p>
        <p>{{ stockPrice }} USD</p>
      </div>
      <div class="company-price-row">
        <p>{{ currentDate }}</p>
        <p :style="{
          color: stockPriceColor,
        }">({{ stockPriceChange }}%) ({{isWeekend ? 'Monday' : 'Today'}})</p>
      </div>
    </div>
    <div class="company-keywords">
      <div
        class="company-keyword"
        v-for="(keyword, index) in keywords"
        :key="index"
      >{{ keyword }}</div>
    </div>
    <div class="company-rollup">
      <img src="@/assets/icons/roll-up.svg" alt="Roll Up">
    </div>
  </Card>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  ref,
  onUnmounted,
} from 'vue';

import Card from '@/components/ui/CardComponent.vue';

import { CompanyController } from '@/controllers/company/types';

export default defineComponent({
  name: 'CompanyView',
  components: {
    Card,
  },
  props: {
    company: {
      type: Object as PropType<CompanyController>,
      required: true,
    },
  },
  setup(props) {
    const date = ref(new Date());

    const dateIntervalId = setInterval(() => {
      date.value = new Date();
    }, 1000);

    const companyIntervalId = setInterval(() => {
      props.company.updatePrimaryData();
    }, 5000);

    const stockPrice = computed(() => (
      Math.round(props.company.data.stockPrice * 100) / 100
    ).toLocaleString());

    const stockPriceChange = computed(() => {
      const change = (Math.round(props.company.data.stockPriceChange * 100) / 100).toLocaleString();

      if (props.company.data.stockPriceChange >= 0) {
        return `+${change}`;
      }

      return change;
    });

    const stockPriceColor = computed(() => {
      console.log(' **************************************************** here is company data ************************************************************************************');
      console.log(props.company.data);
      console.log(' **************************************************** here is company data ************************************************************************************');
      if (props.company.data.stockPriceChange > 0) {
        return '#21B232';
      }

      return '#FC382C';
    });

    const currentDate = computed(() => {
      const month = date.value.toLocaleString('en-US', { month: 'short' });
      const hour = date.value.getUTCHours().toString().padStart(2, '0');
      const minute = date.value.getUTCMinutes().toString().padStart(2, '0');
      return `${month} ${date.value.getUTCDate()}, ${hour}:${minute} EDT`;
    });

    const isWeekend = computed(() => date.value.getDay() === 0 || date.value.getDay() >= 5);

    const keywords = computed(() => props.company.data.keywords.split(','));

    onUnmounted(() => {
      clearInterval(dateIntervalId);
      clearInterval(companyIntervalId);
    });

    return {
      stockPrice,
      stockPriceChange,
      isWeekend,
      stockPriceColor,
      currentDate,
      keywords,
    };
  },
});
</script>

<style>
.company-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.company-header > .company-title > p {
  font-size: 14px;
  font-weight: 600;
}

.company-header > .company-price {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.company-header > .company-price > .company-price-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.company-header > .company-price > .company-price-row > p:first-child {
  min-width: 110px;
  font-size: 14px;
}

.company-header > .company-price > .company-price-row > p:last-child {
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
}

.company-header > .company-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 280px;
}

.company-header > .company-keywords > .company-keyword {
  text-transform: uppercase;
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-text-gray);
  border: 1px solid var(--theme-text-gray);
  border-radius: 100px;
  padding: 4px 12px;
}

.company-header > .company-rollup {
  display: flex;
  align-items: center;
  cursor: pointer;
}
</style>
