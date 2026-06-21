import { createPinia } from 'pinia';
import useUserStore from './modules/user';
import useProductStore from './modules/product';
import useOrderStore from './modules/order';
import useAppStore from './modules/app';
import useSurvivorStore from './modules/survivor';

const pinia = createPinia();

export {
  useUserStore,
  useProductStore,
  useOrderStore,
  useAppStore,
  useSurvivorStore
};

export default pinia;