import api from './auth';

export const paperTradingAPI = {
  account: async () => (await api.get('/paper-trading/account')).data,
  orders: async () => (await api.get('/paper-trading/orders')).data,
  placeOrder: async order => (await api.post('/paper-trading/orders', order)).data,
  executeOrder: async orderId => (await api.post(`/paper-trading/orders/${orderId}/execute`)).data,
  activateKillSwitch: async reason => (await api.post('/paper-trading/kill-switch', { active: true, reason })).data,
  reconcile: async () => (await api.get('/paper-trading/reconcile')).data,
  auditExport: async () => (await api.get('/paper-trading/audit-export')).data,
};

export default paperTradingAPI;
