const { DeliveryOrderModel } = require('carpinteria-erp-models');

const orders = require('./services/orders');
const create = require('./services/create');
const update = require('./services/update');
const deleteDeliveryOrder = require('./services/delete');
const addProduct = require('./services/addProduct');
const updateProduct = require('./services/updateProduct');
const deleteProduct = require('./services/deleteProduct');
const refreshInvoice = require('./services/refreshInvoice');
const countFree = require('./services/countFree');

/**
 * Get data from id
 * @param {string} id
 * @return {Promise<{data: *}>}
 */
const deliveryOrder = ({ id }) => DeliveryOrderModel.findOne({ _id: id });

module.exports = {
  orders,
  create,
  update,
  delete: deleteDeliveryOrder,
  deliveryOrder,
  addProduct,
  updateProduct,
  deleteProduct,
  refreshInvoice,
  countFree,
};
