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
  }

  _handleError(res, error) {
    switch (error.name) {
    case 'ClientIdNotFound':
      this.errorHandler.sendNotFound(res)(error);
      break;
    case 'ParamNotValidError':
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
    logService.logInfo('[inovice]  - Get invoice');
    Promise.resolve(req.params)
      .tap(this.invoiceValidator.validateId)
      .then(this.invoiceService.invoice)
      .then(this.invoiceAdapter.fullResponse)
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
    logService.logInfo('[client invoices] - Crea factura para clientes');
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
    logService.logInfo('[invoices] - Eliminar factura');
    Promise.resolve(req.params)
      .tap(this.invoiceValidator.validateId)
      .tap(this.invoiceValidator.isRemovable)
      .then(this.invoiceService.invoiceDelete)
      .tap(this.deliveryOrderService.refreshInvoice)
      .tap(this.autoIncrementService.decrementInvoice)
      .tap(this.paymentService.remove)
      .tap(this.billingService.remove)
      .tap(this.billingService.refresh)
      .then(() => res.status(204)
        .send())
      .catch(this._handleError.bind(this, res));
  }

  /**
   * Create the invoice
   */
  expenseCreate(req, res) {
    logService.logInfo('[invoices] - Create invoice for expense');
    Promise.resolve(req.body)
      .tap(this.providerValidator.validateProvider)
      .tap(this.invoiceValidator.createParams)
      .tap(this.invoiceValidator.validateNInvoice)
      .then(this.invoiceService.expenseCreate)
      .tap(this.paymentService.create)
      .tap(this.billingService.add)
      .tap(this.billingService.refresh)
      .then(data => res.send(data))
      .catch(this._handleError.bind(this, res));
  }

  /**
   * Edit the invoice
   */
  edit(req, res) {
    logService.logInfo('[invoices]  - Edit invoices');
    Promise.resolve(req)
      .tap(this.invoiceValidator.validateIdParam)
      .tap(this.invoiceValidator.editBody)
      .tap(this.invoiceValidator.validateNInvoiceEdit)
      .then(this.invoiceService.invoiceEdit)
      .then(this.invoiceAdapter.conditionalDataTotalsResponse)
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