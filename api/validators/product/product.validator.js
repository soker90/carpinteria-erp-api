/* eslint-disable nonblock-statement-body-position  */
const { ProductModel } = require('arroyo-erp-models');
const { productErrors } = require('../../../errors');

/**
 * Check if exist id
 * @param {String} id
 * @returns {Promise<void>}
 */
const _checkId = async id => {
  const productExist = await ProductModel.exists({ _id: id });
  if (!productExist) throw new productErrors.ProductNotFound();
};

/**
 * Check if exist id
 * @param {String} id
 * @returns {Promise<void>}
 */
const validateId = ({ id }) => _checkId(id);
const validateIdParam = ({ params }) => validateId(params);
const validateProductBody = ({ body: { product } }) => _checkId(product);

/**
 * Validate params
 * @param {number} code
 * @param {string} name
 * @param {string} provider
 * @param {number} fee
 * @param {number} iva
 * @param {number} re
 * @param {boolean} isUpdate
 * @return {Object}
 * @private
 */
const validateFields = ({
  name,
  iva,
  re,
  profit,
}) => {
  if (!name || !iva || !re || !profit) throw new productErrors.ProductMissingParams();
};

const validateFieldsBody = ({ body }) => validateFields(body);

/**
 * Valida el body de la llamada para ctualizar el precio
 * @param {number} price
 * @param {number} date
 */
const updatePriceBody = ({ body: { price, date } }) => {
  if (!price || typeof price !== 'number' || !date || typeof date !== 'number')
    throw new productErrors.ProductMissingUpdate();
};

module.exports = {
  validateProductBody,
  validateFields,
  validateIdParam,
  validateId,
  validateFieldsBody,
  updatePriceBody,
};
