/* eslint-disable max-classes-per-file */
class ProductMissingParams extends Error {
  /**
   * Create an instance
   *
   * @param {string} [msg=user invalid login] Message for the error
   */
  constructor(msg = 'Faltan campos del producto') {
    super(msg);
    this.name = this.constructor.name;
    this.code = 400;
  }
}

class ProductMissingUpdate extends Error {
  /**
   * Create an instance
   *
   * @param {string} [msg=user invalid login] Message for the error
   */
  constructor(msg = 'Falta el precio o el coste del producto') {
    super(msg);
    this.name = this.constructor.name;
  }
}

class ProductNotFound extends Error {
  /**
   * Create an instance
   *
   * @param {string} [msg=user invalid login] Message for the error
   */
  constructor(msg = 'No existe el producto') {
    super(msg);
    this.name = this.constructor.name;
  }
}

class ProviderNotFound extends Error {
  /**
   * Create an instance
   *
   * @param {string} [msg=user invalid login] Message for the error
   */
  constructor(msg = 'No se ha encontrado el proveedor') {
    super(msg);
    this.name = this.constructor.name;
  }
}

class ProductCodeExists extends Error {
  /**
   * Create an instance
   *
   * @param {string} [msg=user invalid login] Message for the error
   */
  constructor(msg = 'El código de producto ya existe') {
    super(msg);
    this.name = this.constructor.name;
  }
}

module.exports = {
  ProductMissingParams,
  ProductMissingUpdate,
  ProductNotFound,
  ProviderNotFound,
  ProductCodeExists,
};
