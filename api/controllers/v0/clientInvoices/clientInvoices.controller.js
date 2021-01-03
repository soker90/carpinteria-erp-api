const Promise = require('bluebird');

const LogService = require('../../../services/log.service');

const TYPE = 'ClientInvoiceController';

const logService = new LogService(TYPE);

class ClientInvoicesController {
  constructor({
    invoiceService,
    paymentService,
    errorHandler,
    invoiceAdapter,
    invoiceValidator,
    billingService,
    providerValidator,
    deliveryOrderService,
    autoIncrementService,
    clientValidator,
    clientInvoiceService,
    clientInvoiceValidator,
    clientInvoiceAdapter,
    deliveryOrderValidator,
  }) {
    this.invoiceService = invoiceService;
    this.errorHandler = errorHandler;
    this.invoiceAdapter = invoiceAdapter;
    this.paymentService = paymentService;
    this.invoiceValidator = invoiceValidator;
    this.billingService = billingService;
    this.providerValidator = providerValidator;
    this.deliveryOrderService = deliveryOrderService;
    this.autoIncrementService = autoIncrementService;
    this.clientValidator = clientValidator;
    this.clientInvoiceService = clientInvoiceService;
    this.clientInvoiceValidator = clientInvoiceValidator;
    this.clientInvoiceAdapter = clientInvoiceAdapter;
    this.deliveryOrderValidator = deliveryOrderValidator;
  }

  _handleError(res, error) {
    switch (error.name) {
    case 'ClientIdNotFound':
    case 'InvoiceIdNotFound':
    case 'DeliveryOrderNotFound':
      this.errorHandler.sendNotFound(res)(error);
      break;
    case 'ParamNotValidError':
    case 'InvoiceParamsMissing':
    case 'InvoiceNoRemovable':
    case 'DateNotValid':
    case 'DeliveryOrderNoRemovable':
      this.errorHandler.sendBadRequest(res)(error);
      break;
      /* istanbul ignore next */
    default:
      this.errorHandler.sendError(res)(error);
      break;
    }
  }

  /**
   * Return invoice
   */
  invoice(req, res) {
    logService.logInfo('[inovice]  - Get invoice of client');
    Promise.resolve(req.params)
      .tap(this.clientInvoiceValidator.validateId)
      .then(this.clientInvoiceService.invoice)
      // .then(this.invoiceAdapter.fullResponse)
      .then(data => res.send(data))
      .catch(this._handleError.bind(this, res));
  }

  /**
   * Return all client invoices
   */
  invoices(req, res) {
    logService.logInfo('[invoices] - List of client invoices');
    Promise.resolve(req.query)
      .tap(this.invoiceValidator.isValidYear)
      .then(this.clientInvoiceService.invoices)
      .then(data => res.send(data))
      .catch(this._handleError.bind(this, res));
  }

  invoicesShort(req, res) {
    logService.logInfo(
      '[invoicesShort] - List of client invoices with short info',
    );
    Promise.resolve(req.query)
      .tap(this.clientValidator.validateClient)
      .then(this.clientInvoiceService.invoicesShort)
      .then(data => res.send(data))
      .catch(this._handleError.bind(this, res));
  }

  /**
   * Create the client invoice
   */
  create(req, res) {
    logService.logInfo('[create] - Crea factura para clientes');
    Promise.resolve(req.body)
      .tap(this.clientValidator.validateClient)
      .then(this.clientInvoiceService.create)
      .then(data => res.send(data))
      .catch(this._handleError.bind(this, res));
  }

  /**
   * Delete invoice
   */
  delete(req, res) {
    logService.logInfo('[delete] - Eliminar factura de cliente');
    Promise.resolve(req.params)
      .tap(this.clientInvoiceValidator.validateId)
      .tap(this.clientInvoiceValidator.isRemovable)
      .then(this.clientInvoiceService.invoiceDelete)
      .tap(this.autoIncrementService.decrementClientInvoice)
      .then(() => res.status(204)
        .send())
      .catch(this._handleError.bind(this, res));
  }

  /**
   * Edit the client invoice
   */
  edit(req, res) {
    logService.logInfo('[edit]  - Edit client invoices');
    Promise.resolve(req)
      .tap(this.clientInvoiceValidator.validateIdParam)
      .tap(this.clientInvoiceValidator.editBody)
      .then(this.clientInvoiceService.invoiceEdit)
      .then(this.clientInvoiceAdapter.conditionalDataTotalsResponse)
      .then(data => res.send(data))
      .catch(this._handleError.bind(this, res));
  }

  /**
   * Edit the delivery order of the client invoice
   */
  addDeliveryOrder(req, res) {
    logService.logInfo('[addDeliveryOrder]  - Añade un albarán a la factura');
    Promise.resolve(req.params)
      .tap(this.clientInvoiceValidator.validateId)
      .then(this.clientInvoiceService.addDeliveryOrder)
      .then(data => res
        .send(data))
      .catch(this._handleError.bind(this, res));
  }

  /**
   * Edit the delivery order of the client invoice
   */
  editDeliveryOrder(req, res) {
    logService.logInfo('[addDeliveryOrder]  - Actualiza un albarán de la factura');
    Promise.resolve(req)
      .tap(this.clientInvoiceValidator.validateIdParam)
      .tap(this.clientInvoiceValidator.validateDeliveryOrderParam)
      .tap(this.clientInvoiceValidator.isValidDate)
      .then(this.clientInvoiceService.editDeliveryOrder)
      .then(() => res.status(204)
        .send())
      .catch(this._handleError.bind(this, res));
  }

  /**
   * Delete the delivery order of the client invoice
   */
  deleteDeliveryOrder(req, res) {
    logService.logInfo('[deleteDeliveryOrder]  - Elimina un albarán de la factura');
    Promise.resolve(req.params)
      .tap(this.clientInvoiceValidator.validateId)
      .tap(this.clientInvoiceValidator.validateDeliveryOrder)
      .tap(this.clientInvoiceValidator.isDORemovable)
      .then(this.clientInvoiceService.deleteDeliveryOrder)
      .then(() => res.status(204)
        .send())
      .catch(this._handleError.bind(this, res));
  }

  /**
   * Add product to the delivery order
   */
  addProduct(req, res) {
    logService.logInfo('[addProduct]  - Añade un producto a un albarán');
    Promise.resolve(req)
      .tap(this.clientInvoiceValidator.validateIdParam)
      .tap(this.clientInvoiceValidator.validateDeliveryOrderParam)
      .tap(this.clientInvoiceValidator.validateProduct)
      .then(this.clientInvoiceService.addProduct)
      .then(data => res.send(data))
      .catch(this._handleError.bind(this, res));
  }

  /**
   * Return invoice
   */
  invoiceConfirm(req, res) {
    logService.logInfo('[inovice]  - Confirm invoice');
    Promise.resolve(req)
      .tap(this.invoiceValidator.validateIdParam)
      .tap(this.invoiceValidator.confirmParams)
      .then(this.invoiceService.invoiceConfirm)
      .tap(this.paymentService.create)
      .tap(this.billingService.add)
      .tap(this.billingService.refresh)
      .then(this.invoiceAdapter.dataAndPaymentResponse)
      .then(data => res.send(data))
      .catch(this._handleError.bind(this, res));
  }

  export(req, res) {
    logService.logInfo('[inovice]  - Export invoices to book');
    Promise.resolve(req.params)
      .tap(this.invoiceValidator.isValidYear)
      .then(this.invoiceService.exportOds)
      .then(data => res.send(data))
      .catch(this._handleError.bind(this, res));
  }

  swap(req, res) {
    logService.logInfo('[inovice]  - Intercambia el número de order de dos facturas');
    Promise.resolve(req.params)
      .tap(this.invoiceValidator.validateTwoIds)
      .then(this.invoiceService.swap)
      .then(() => res.status(204)
        .send())
      .catch(this._handleError.bind(this, res));
  }
}

module.exports = ClientInvoicesController;
