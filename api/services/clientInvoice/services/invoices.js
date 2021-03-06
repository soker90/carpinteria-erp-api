const { ClientInvoiceModel } = require('carpinteria-erp-models');

/**
 * Get all client invoices
 * @param {String} year
 * @returns {Promise<*>}
 */
const invoices = ({
  year,
}) => {
  const start = new Date(year);
  const nextYear = Number(year) + 1;
  const end = new Date(nextYear.toString());

  return ClientInvoiceModel.find({
    date: {
      $gte: start,
      $lt: end,
    },
  }, '_id nameClient total date nInvoice payment.paid')
    .sort({ date: -1 })
    .lean();
};

module.exports = invoices;
