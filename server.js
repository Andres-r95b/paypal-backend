// server.js
const express = require('express');
const paypal = require('@paypal/checkout-server-sdk');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configura tus credenciales PayPal aquí (sandbox o live)
const clientId = 'TU_CLIENT_ID_DE_PAYPAL';
const clientSecret = 'TU_CLIENT_SECRET_DE_PAYPAL';

let environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
// Si quieres en producción:
// let environment = new paypal.core.LiveEnvironment(clientId, clientSecret);

const client = new paypal.core.PayPalHttpClient(environment);

// Crear pago (orden)
app.post('/api/pay', async (req, res) => {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: '1.00' // monto a cobrar
      }
    }]
  });

  try {
    const order = await client.execute(request);
    const approvalUrl = order.result.links.find(link => link.rel === 'approve').href;
    res.json({ approval_url: approvalUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando el pago' });
  }
});

// Capturar pago (confirmar)
app.post('/api/capture', async (req, res) => {
  const { orderID } = req.body;
  if (!orderID) return res.status(400).json({ error: 'Falta orderID' });

  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await client.execute(request);
    res.json({ status: 'COMPLETED', details: capture.result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error capturando el pago' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
