/* eslint-disable nonblock-statement-body-position */
const { PaymentModel, InvoiceModel } = require('arroyo-erp-models');

/**
 * Actualiza el pago con los datos dados
 * @param {String} id
 * @param {Object} data
 * @returns {Promise<Object>}
 * @private
 */
const _updatePayment = (id, data) => PaymentModel
  .findOneAndUpdate({ _id: id }, data, { new: true });

/**
 * Actualiza las facturas con la información del pago
 * @param {Array<string>} invoices
 * @param {Object} payment
 * @returns {Promise<void>}
 * @private
 */
const _updateInvoices = async ({ invoices }, payment) => {
  for (const invoiceId of invoices)
    await InvoiceModel.findOneAndUpdate({ _id: invoiceId }, { payment });
};
/**
 * Confirma la realización del pago
 * @param {String} id
 * @param {number} paymentDate
 * @param {string} type
 * @param {string} numCheque
 * @returns {Promise<void>}
 */
const confirm = async ({ params: { id }, body: { paymentDate, type, numCheque } }) => {
  const paymentData = {
    paymentDate,
    type,
    ...(numCheque && { numCheque }),
    paid: true,
  };

  const payment = await _updatePayment(id, paymentData);

  await _updateInvoices(payment, paymentData);
};

module.exports = confirm;