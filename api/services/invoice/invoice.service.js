const { InvoiceModel, DeliveryOrderModel } = require('carpinteria-erp-models');

// Split services
const invoiceConfirm = require('./services/invoiceConfirm');
const create = require('./services/create');
const invoiceEdit = require('./services/invoiceEdit');
const refresh = require('./services/refresh');
const invoices = require('./services/invoices');
const invoicesShort = require('./services/invoicesShort');
const expenseCreate = require('./services/expenseCreate');
const exportOds = require('./services/export');
const invoiceDelete = require('./services/invoiceDelete');
const swap = require('./services/swap');

/**
 * Get invoice data
 * @param {String} id
 * @returns {Promise<*>}
 */
const invoice = ({ id }) => InvoiceModel.findOne({ _id: id })
  .populate('deliveryOrders', null, DeliveryOrderModel);

module.exports = {
  create,
  invoice,
  invoices,
  invoicesShort,
  invoiceConfirm,
  invoiceEdit,
  refresh,
  expenseCreate,
  exportOds,
  invoiceDelete,
  swap,
};
