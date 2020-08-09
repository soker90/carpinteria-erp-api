const supertest = require('supertest');
const { mongoose, DeliveryOrderModel, ProviderModel } = require('arroyo-erp-models');
const testDB = require('../../../../test/test-db')(mongoose);
const requestLogin = require('../../../../test/request-login');
const app = require('../../../../index');
const { deliveryOrderErrors } = require('../../../../errors');
const { CONCEPT } = require('../../../../constants');
const { roundNumber } = require('../../../../utils');

const deliveryOrderMock = {
  provider: '5f14857d3ae0d32b417e8d0c',
  nameProvider: 'Primero',
  date: 1596632580000.0,
  total: 75.48,
  iva: 6.8,
  rate: 0.5,
  re: 0.68,
  taxBase: 68,
  products: [
    {
      code: '',
      product: '5f188ec1deae8d5c1b549336',
      price: 8,
      quantity: 8,
      name: 'yiuyi',
      taxBase: 68,
      rate: 0.5,
      iva: 6.8,
      re: 0.68,
      total: 75.48,
    },
  ],
};

const deliveryOrder2Mock = {
  provider: '5f14857d3ae0d32b417e8d0c',
  nameProvider: 'Primero',
  date: 1597323720000.0,
  size: 0,
  total: 69.544,
  iva: 2.624,
  rate: 0.201,
  re: 1.312,
  taxBase: 65.608,
  products: [
    {
      code: '12',
      product: '5f148a51702f6d366d76d9c4',
      price: 8,
      quantity: 8,
      name: 'prueba',
      taxBase: 65.608,
      rate: 0.201,
      diff: 7,
      iva: 2.624,
      re: 1.312,
      total: 69.544,
    },
  ],
  invoice: '5f2ea2b4536f7e67a53d07f7',
  nOrder: 47,
};

const invoiceMock = {
  deliveryOrders: [
    deliveryOrderMock, deliveryOrder2Mock,
  ],
  total: 75.48,
  iva: 6.8,
  re: 0.68,
  taxBase: 68,
  nameProvider: 'Primero',
  provider: '5f14857d3ae0d32b417e8d0c',
  dateRegister: 1596891828425.0,
  concept: 'Compras',
  __v: 0,
  dateInvoice: 1597410180000.0,
  nInvoice: '33',
  nOrder: 47,
  payment: {
    paymentDate: 1596891780000.0,
    type: 'Talón',
    numCheque: '888',
    paid: true,
  },
};

describe('DeliveryOrderController', () => {
  beforeAll(() => testDB.connect());
  afterAll(() => testDB.disconnect());

  describe('GET /deliveryorders', () => {
    describe('Usuario no autenticado', () => {
      let response;

      beforeAll(done => {
        supertest(app)
          .get('/deliveryorders')
          .end((err, res) => {
            response = res;
            done();
          });
      });

      test('Debería dar un 401', () => {
        expect(response.statusCode)
          .toBe(401);
      });
    });

    describe('Usuario autenticado', () => {
      let token;
      before(done => {
        requestLogin()
          .then(res => {
            token = res;
            done();
          });
      });

      test('Se ha autenticado el usuario', () => {
        expect(token)
          .toBeTruthy();
      });

      describe('No hay albaranes', () => {
        let response;

        before(done => {
          supertest(app)
            .get('/deliveryorders')
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
              response = res;
              done();
            });
        });

        test('Debería dar un 200', () => {
          expect(response.statusCode)
            .toBe(200);
        });

        test('Devuelve dos arrays vacios', () => {
          expect(response.body.free.length)
            .toBe(0);
          expect(response.body.inInvoices.count)
            .toBe(0);
          expect(response.body.inInvoices.data.length)
            .toBe(0);
        });
      });

      describe('Dispone de albaranes', () => {
        let deliveryOrder;
        let deliveryOrder2;

        before(async () => {
          deliveryOrder = await DeliveryOrderModel.create(deliveryOrderMock);
          deliveryOrder2 = await DeliveryOrderModel.create(deliveryOrder2Mock);
        });

        describe('No se pasa offset ni limit', () => {
          let response;

          before(done => {
            supertest(app)
              .get(`/deliveryorders?provider=${deliveryOrder.provider}`)
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                response = res;
                done();
              });
          });

          test('Debería dar un 200', () => {
            expect(response.status)
              .toBe(200);
          });

          test('Devuelve un albarán sin factura', () => {
            expect(response.body.free.length)
              .toBe(1);
            expect(response.body.free[0]._id.localeCompare(deliveryOrder._id))
              .toBe(0);
          });

          test('Devuelve un albarán en facturas', () => {
            expect(response.body.inInvoices.count)
              .toBe(1);
            expect(response.body.inInvoices.data.length)
              .toBe(1);
            expect(response.body.inInvoices.data[0]._id.localeCompare(deliveryOrder2._id))
              .toBe(0);
          });
        });

        describe('Con limit y offset 1', () => {
          let response;
          let deliveryOrder3;

          before(async () => {
            deliveryOrder3 = await DeliveryOrderModel.create(deliveryOrder2Mock);
            await DeliveryOrderModel.create(deliveryOrder2Mock);
          });

          beforeAll(done => {
            supertest(app)
              .get(`/deliveryorders?provider=${deliveryOrder.provider}&offset=1&limit=2`)
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                response = res;
                done();
              });
          });

          test('Debería dar un 200', () => {
            expect(response.statusCode)
              .toBe(200);
          });

          test('Devuelve un albarán en facturas', () => {
            expect(response.body.inInvoices.count)
              .toBe(3);
            expect(response.body.inInvoices.data.length)
              .toBe(2);
            expect(response.body.inInvoices.data[0]._id.localeCompare(deliveryOrder3._id))
              .toBe(0);
          });
        });
      });
    });
  });

  describe('POST /deliveryorders', () => {
    const PATH = '/deliveryorders';
    describe('Usuario no autenticado', () => {
      let response;

      beforeAll(done => {
        supertest(app)
          .post(PATH)
          .end((err, res) => {
            response = res;
            done();
          });
      });

      test('Debería dar un 401', () => {
        expect(response.statusCode)
          .toBe(401);
      });
    });

    describe('Usuario autenticado', () => {
      let token;
      before(done => {
        requestLogin()
          .then(res => {
            token = res;
            done();
          });
      });

      test('Se ha autenticado el usuario', () => {
        expect(token)
          .toBeTruthy();
      });

      describe('No se envía proveedor', () => {
        let response;

        before(done => {
          supertest(app)
            .post(PATH)
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
              response = res;
              done();
            });
        });

        test('Debería dar un 400', () => {
          expect(response.statusCode)
            .toBe(400);
        });

        test('El mensaje de error es correcto', () => {
          expect(response.body.message)
            .toBe(new deliveryOrderErrors.DeliveryOrderMissing().message);
        });
      });

      describe('El proveedor no existe', () => {
        let response;

        const dataSend = {
          provider: '5f148a51702f6d366d76d9c4',
        };

        before(done => {
          supertest(app)
            .post(PATH)
            .set('Authorization', `Bearer ${token}`)
            .send(dataSend)
            .end((err, res) => {
              response = res;
              done();
            });
        });

        test('Debería dar un 404', () => {
          expect(response.statusCode)
            .toBe(404);
        });

        test('El mensaje de error es correcto', () => {
          expect(response.body.message)
            .toBe(new deliveryOrderErrors.DeliveryOrderProviderNotFound().message);
        });
      });

      describe('Se crea el proveedor', () => {
        let response;
        let provider;

        before(() => ProviderModel.create({ name: 'Mi proveedor' })
          .then(providerCreated => {
            provider = providerCreated;
          }));

        beforeAll(done => {
          supertest(app)
            .post(PATH)
            .set('Authorization', `Bearer ${token}`)
            .send({ provider: provider._id })
            .end((err, res) => {
              response = res;
              done();
            });
        });

        test('Debería dar un 200', () => {
          expect(response.statusCode)
            .toBe(200);
        });

        test('Devuelve un albarán en facturas', () => {
          expect(response.body._id)
            .toBeTruthy();
          expect(response.body.nameProvider)
            .toBe(provider.name);
          expect(`${response.body.provider}`)
            .toBe(provider._id.toString());
          expect(response.body.totals.iva)
            .toBe(0);
          expect(response.body.totals.rate)
            .toBe(0);
          expect(response.body.totals.re)
            .toBe(0);
          expect(response.body.totals.taxBase)
            .toBe(0);
          expect(response.body.totals.total)
            .toBe(0);
        });
      });
    });
  });

  /* describe('GET /invoices/short', () => {
    before(() => testDB.clean());

    describe('Usuario no autenticado', () => {
      let response;

      beforeAll(done => {
        supertest(app)
          .get('/invoices/short')
          .end((err, res) => {
            response = res;
            done();
          });
      });

      test('Debería dar un 401', () => {
        expect(response.statusCode)
          .toBe(401);
      });
    });

    describe('Usuario autenticado', () => {
      let token;
      before(done => {
        requestLogin()
          .then(res => {
            token = res;
            done();
          });
      });

      test('Se ha autenticado el usuario', () => {
        expect(token)
          .toBeTruthy();
      });

      describe('Sin facturas', () => {
        let response;

        before(done => {
          supertest(app)
            .get('/invoices/short')
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
              response = res;
              done();
            });
        });

        test('Debería dar un 200', () => {
          expect(response.status)
            .toBe(200);
        });

        test('Devuelve un array', () => {
          expect(JSON.parse(response.text))
            .toEqual([]);
        });
      });

      describe('Dispone de facturas', () => {
        let invoice;

        before(() => InvoiceModel.create({
          total: 295.74,
          dateInvoice: 1594474393373.0,
          nInoice: '22/2020',
          nOrder: 2,
        })
          .then(invoiceCreated => {
            invoice = invoiceCreated;
          }));

        describe('No se pasan parámetros', () => {
          let response;

          before(done => {
            supertest(app)
              .get('/invoices/short')
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                response = res;
                done();
              });
          });

          test('Debería dar un 200', () => {
            expect(response.status)
              .toBe(200);
          });

          test('Devuelve un array con un elemento', () => {
            expect(JSON.parse(response.text).length)
              .toBe(1);
          });

          test('Los datos son correctos', () => {
            const json = JSON.parse(response.text)[0];
            expect(JSON.stringify(json._id))
              .toEqual(JSON.stringify(invoice._id));
            expect(json.nOrder)
              .toBe(invoice.nOrder);
            expect(json.total)
              .toBe(invoice.total);
            expect(json.dateInvoice)
              .toBe(invoice.dateInvoice);
          });
        });
      });
    });
  });

  describe('GET /invoices/:id', () => {
    describe('Usuario no autenticado', () => {
      let response;

      beforeAll(done => {
        supertest(app)
          .get('/invoices/5ef26172ccfd9d1541b870be')
          .end((err, res) => {
            response = res;
            done();
          });
      });

      test('Debería dar un 401', () => {
        expect(response.statusCode)
          .toBe(401);
      });
    });

    describe('Usuario autenticado', () => {
      let token;
      before(done => {
        requestLogin()
          .then(res => {
            token = res;
            done();
          });
      });

      test('Se ha autenticado el usuario', () => {
        expect(token)
          .toBeTruthy();
      });

      describe('El id de la factura no existe', () => {
        let response;

        beforeAll(done => {
          supertest(app)
            .get('/invoices/5ef26172ccfd9d1541b870be')
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
              response = res;
              done();
            });
        });

        test('Debería dar un 404', () => {
          expect(response.status)
            .toBe(404);
        });
      });

      describe('Devuelve los datos de la factura ', () => {
        let response;
        let invoice;

        before(() => InvoiceModel.create(invoiceMock)
          .then(invoiceCreated => {
            invoice = invoiceCreated;
          }));

        beforeAll(done => {
          supertest(app)
            .get(`/invoices/${invoice._id}`)
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
              response = res;
              done();
            });
        });

        test('Debería dar un 200', () => {
          expect(token)
            .toBeTruthy();

          expect(response.statusCode)
            .toBe(200);
        });

        test('Los datos son correctos', () => {
          const bodyResponse = response.body;
          expect(bodyResponse.provider)
            .toBe(invoiceMock.provider);
          expect(bodyResponse.name)
            .toBe(invoiceMock.name);
          expect(bodyResponse.deliveryOrders.length)
            .toBe(invoiceMock.deliveryOrders.length);
        });
      });
    });
  });

  describe('POST /invoices', () => {
    describe('Usuario no autenticado', () => {
      let response;

      beforeAll(done => {
        supertest(app)
          .post('/invoices')
          .end((err, res) => {
            response = res;
            done();
          });
      });

      test('Debería dar un 401', () => {
        expect(response.statusCode)
          .toBe(401);
      });
    });

    describe('Usuario autenticado', () => {
      let token;
      before(done => {
        requestLogin()
          .then(res => {
            token = res;
            done();
          });
      });

      test('Se ha autenticado el usuario', () => {
        expect(token)
          .toBeTruthy();
      });

      describe('No se envía concepto', () => {
        let response;

        beforeAll(done => {
          supertest(app)
            .post('/invoices')
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
              response = res;
              done();
            });
        });

        test('Debería dar un 400', async () => {
          expect(token)
            .toBeTruthy();

          expect(response.statusCode)
            .toBe(400);
        });
      });

      describe('No se envía albaranes', () => {
        let response;

        beforeAll(done => {
          supertest(app)
            .post('/invoices')
            .set('Authorization', `Bearer ${token}`)
            .send({ concept: CONCEPT.COMPRAS })
            .end((err, res) => {
              response = res;
              done();
            });
        });

        test('Debería dar un 400', async () => {
          expect(token)
            .toBeTruthy();

          expect(response.statusCode)
            .toBe(400);
        });
      });

      describe('El abarán no existe', () => {
        let response;

        beforeAll(done => {
          supertest(app)
            .post('/invoices')
            .set('Authorization', `Bearer ${token}`)
            .send({
              concept: CONCEPT.COMPRAS,
              deliveryOrders: ['5f188ec1deae8d5c1b549336'],
            })
            .end((err, res) => {
              response = res;
              done();
            });
        });

        test('Debería dar un 404', async () => {
          expect(token)
            .toBeTruthy();

          expect(response.statusCode)
            .toBe(404);
        });
      });

      describe('Se crea la factura correctamente', () => {
        let response;
        let deliveryOrder;

        before(() => DeliveryOrderModel.create(deliveryOrderMock)
          .then(orderCreated => {
            deliveryOrder = orderCreated;
          }));

        describe('Se crea la factura de un albarán', () => {
          beforeAll(done => {
            supertest(app)
              .post('/invoices/')
              .send({
                concept: CONCEPT.COMPRAS,
                deliveryOrders: [deliveryOrder._id],
              })
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                response = res;
                done();
              });
          });

          test('Debería dar un 200', () => {
            expect(token)
              .toBeTruthy();
            expect(response.statusCode)
              .toBe(200);
          });

          test('Devuelve los datos correctos', () => {
            const deliveryOrderResponse = response.body.deliveryOrders[0];
            expect(response.body.concept)
              .toBe(CONCEPT.COMPRAS);
            expect(deliveryOrder._id.toString())
              .toBe(deliveryOrderResponse._id);
            expect(response.body.iva)
              .toBe(deliveryOrder.iva);
            expect(response.body.nameProvider)
              .toBe(deliveryOrder.nameProvider);
            expect(response.body.provider)
              .toBe(deliveryOrder.provider);
            expect(response.body.re)
              .toBe(deliveryOrder.re);
            expect(response.body.taxBase)
              .toBe(deliveryOrder.taxBase);
            expect(response.body.total)
              .toBe(deliveryOrder.total);
          });
        });

        describe('Se crea la factura de dos albaranes', () => {
          let deliveryOrder2;
          before(() => DeliveryOrderModel.create(deliveryOrder2Mock)
            .then(orderCreated => {
              deliveryOrder2 = orderCreated;
            }));

          beforeAll(done => {
            supertest(app)
              .post('/invoices/')
              .send({
                concept: CONCEPT.COMPRAS,
                deliveryOrders: [deliveryOrder._id, deliveryOrder2._id],
              })
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                response = res;
                done();
              });
          });

          test('Debería dar un 200', () => {
            expect(token)
              .toBeTruthy();
            expect(response.statusCode)
              .toBe(200);
          });

          test('Devuelve los datos correctos', () => {
            const deliveryOrderResponse = response.body.deliveryOrders[0];
            const deliveryOrder2Response = response.body.deliveryOrders[1];
            expect(response.body.concept)
              .toBe(CONCEPT.COMPRAS);
            expect(deliveryOrder._id.toString())
              .toBe(deliveryOrderResponse._id);
            expect(deliveryOrder2._id.toString())
              .toBe(deliveryOrder2Response._id);
            expect(response.body.iva)
              .toBe(roundNumber(deliveryOrder.iva + deliveryOrder2.iva, 2));
            expect(response.body.nameProvider)
              .toBe(deliveryOrder.nameProvider);
            expect(response.body.provider)
              .toBe(deliveryOrder.provider);
            expect(response.body.re)
              .toBe(roundNumber(deliveryOrder.re + deliveryOrder2.re, 2));
            expect(response.body.taxBase)
              .toBe(roundNumber(deliveryOrder.taxBase + deliveryOrder2.taxBase, 2));
            expect(response.body.total)
              .toBe(roundNumber(deliveryOrder.total + deliveryOrder2.total, 2));
          });
        });
      });
    });
  });

  describe('PATCH /invoices/:id', () => {
    describe('Usuario no autenticado', () => {
      let response;

      beforeAll(done => {
        supertest(app)
          .patch('/invoices/5ef26172ccfd9d1541b870be')
          .end((err, res) => {
            response = res;
            done();
          });
      });

      test('Debería dar un 401', () => {
        expect(response.statusCode)
          .toBe(401);
      });
    });

    describe('Usuario autenticado', () => {
      let token;
      before(done => {
        requestLogin()
          .then(res => {
            token = res;
            done();
          });
      });

      test('Se ha autenticado el usuario', () => {
        expect(token)
          .toBeTruthy();
      });

      describe('No contiene datos de la factura ni totales', () => {
        let response;
        let invoice;

        before(() => InvoiceModel.create({})
          .then(invoiceCreated => {
            invoice = invoiceCreated;
          }));

        beforeAll(done => {
          supertest(app)
            .patch(`/invoices/${invoice._id}`)
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
              response = res;
              done();
            });
        });

        test('Debería dar un 400', async () => {
          expect(token)
            .toBeTruthy();

          expect(response.statusCode)
            .toBe(400);
        });
      });

      describe('Actualiza los campos', () => {
        let response;
        let invoice;
        const invoiceData = {
          dateInvoice: 1594062299563,
          dateRegister: 1594062299563,
          nInvoice: '333/2203',
        };

        const invoiceTotals = {
          total: 12,
          iva: 10,
          re: 8,
          rate: 2.2,
          taxBase: 3.6,
        };

        before(() => InvoiceModel.create({
          dateInvoice: Date.now(),
        })
          .then(invoiceCreated => {
            invoice = invoiceCreated;
          }));

        const testData = () => {
          const { data } = JSON.parse(response.text);
          expect(data.dateInvoice)
            .toBe(invoiceData.dateInvoice);
          expect(data.dateRegister)
            .toBe(invoiceData.dateRegister);
          expect(data.nInvoice)
            .toBe(invoiceData.nInvoice);
        };

        const testTotals = () => {
          const { totals } = JSON.parse(response.text);
          expect(totals.total)
            .toBe(invoiceTotals.total);
          expect(totals.iva)
            .toBe(invoiceTotals.iva);
          expect(invoiceTotals.re)
            .toBe(invoiceTotals.re);
          expect(invoiceTotals.rate)
            .toBe(invoiceTotals.rate);
          expect(invoiceTotals.taxBase)
            .toBe(invoiceTotals.taxBase);
        };

        describe('Se actualiza data y totals', () => {
          beforeAll(done => {
            supertest(app)
              .patch(`/invoices/${invoice._id}`)
              .send({
                data: invoiceData,
                totals: invoiceTotals,
              })
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                response = res;
                done();
              });
          });

          test('Debería dar un 200', () => {
            expect(token)
              .toBeTruthy();
            expect(response.statusCode)
              .toBe(200);
          });

          test('Se ha actualizado data', () => {
            testData();
          });

          test('Se ha actualizado los totales', () => {
            testTotals();
          });
        });

        describe('Se actualiza data', () => {
          beforeAll(done => {
            supertest(app)
              .patch(`/invoices/${invoice._id}`)
              .send({
                data: invoiceData,
              })
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                response = res;
                done();
              });
          });

          test('Debería dar un 200', () => {
            expect(token)
              .toBeTruthy();
            expect(response.statusCode)
              .toBe(200);
          });

          test('Se han actualizado data', () => {
            testData();
          });
        });

        describe('Se actualiza los totales', () => {
          beforeAll(done => {
            supertest(app)
              .patch(`/invoices/${invoice._id}`)
              .send({
                totals: invoiceTotals,
              })
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                response = res;
                done();
              });
          });

          test('Debería dar un 200', () => {
            expect(token)
              .toBeTruthy();
            expect(response.statusCode)
              .toBe(200);
          });

          test('Se ha actualizado los totales', () => {
            testTotals();
          });
        });
      });
    });
  });

  describe('PATCH /invoices/:id/confirm', () => {
    describe('Usuario no autenticado', () => {
      let response;

      beforeAll(done => {
        supertest(app)
          .patch('/invoices/5ef26172ccfd9d1541b870be/confirm')
          .end((err, res) => {
            response = res;
            done();
          });
      });

      test('Debería dar un 401', () => {
        expect(response.statusCode)
          .toBe(401);
      });
    });

    describe('Usuario autenticado', () => {
      let token;
      before(done => {
        requestLogin()
          .then(res => {
            token = res;
            done();
          });
      });

      test('Se ha autenticado el usuario', () => {
        expect(token)
          .toBeTruthy();
      });

      describe('El id de la factura no existe', () => {
        let response;

        beforeAll(done => {
          supertest(app)
            .patch('/invoices/5ef26172ccfd9d1541b870be/confirm')
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
              response = res;
              done();
            });
        });

        test('Debería dar un 404', () => {
          expect(response.status)
            .toBe(404);
        });
      });

      describe('No tiene fecha de factura', () => {
        let response;
        let invoice;

        before(() => InvoiceModel.create({})
          .then(invoiceCreated => {
            invoice = invoiceCreated;
          }));

        beforeAll(done => {
          supertest(app)
            .patch(`/invoices/${invoice._id}/confirm`)
            .set('Authorization', `Bearer ${token}`)
            .send({ type: 'Efectivo' })
            .end((err, res) => {
              response = res;
              done();
            });
        });

        test('Debería dar un 422', async () => {
          expect(token)
            .toBeTruthy();

          expect(response.statusCode)
            .toBe(422);
        });
      });

      describe('No tiene tipo de pago', () => {
        let response;
        let invoice;

        before(() => InvoiceModel.create({
          dateInvoice: Date.now(),
        })
          .then(invoiceCreated => {
            invoice = invoiceCreated;
          }));

        beforeAll(done => {
          supertest(app)
            .patch(`/invoices/${invoice._id}/confirm`)
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
              response = res;
              done();
            });
        });

        test('Debería dar un 400', async () => {
          expect(token)
            .toBeTruthy();

          expect(response.statusCode)
            .toBe(400);
        });
      });

      describe('Asigna el número de orden', () => {
        let response;
        let invoice;

        before(() => InvoiceModel.create({
          dateInvoice: Date.now(),
        })
          .then(invoiceCreated => {
            invoice = invoiceCreated;
          }));

        beforeAll(done => {
          supertest(app)
            .patch(`/invoices/${invoice._id}/confirm`)
            .set('Authorization', `Bearer ${token}`)
            .send({ type: 'Efectivo' })
            .end((err, res) => {
              response = res;
              done();
            });
        });

        test('Debería dar un 200', () => {
          expect(token)
            .toBeTruthy();
          expect(response.statusCode)
            .toBe(200);
        });

        test('Se ha asignado un número de order', () => {
          expect(JSON.parse(response.text).nOrder)
            .toBe(1);
        });
      });
    });
  });
  */
});
