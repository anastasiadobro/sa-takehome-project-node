const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
require('dotenv').config();

// Pass your Secret API Key to initialize the Stripe backend instance safely
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

var app = express();

// view engine setup (Handlebars)
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({}));

/**
 * Home route
 */
app.get('/', function(req, res) {
  res.render('index');
});

/**
 * Checkout route
 */
app.get('/checkout', function(req, res) {
  const item = req.query.item;
  let title, amount, error;

  // Map item selections based on Matt's inventory list strings
  switch (item) {
    case '1':
      title = "The Art of Doing Science and Engineering";
      amount = 2300;     
      break;
    case '2':
      title = "The Making of Prince of Persia: Journals 1985-1993";
      amount = 2500;
      break;     
    case '3':
      title = "Working in Public: The Making and Maintenance of Open Source";
      amount = 2800; 
      break;     
    default:
      error = "No item selected";     
      break;
  }

  // PASS the Stripe Publishable Key down to the client layout frame here
  res.render('checkout', {
    title: title,
    amount: amount,
    error: error,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

/**
 * Stripe PaymentIntent Creation Endpoint
 */
app.post('/create-payment-intent', async (req, res) => {
  const { itemIndex } = req.body;

  // Dynamic server-side calculation using the actual item IDs from the inventory list
  let amountInCents = 0;
  switch (itemIndex) {
    case '1': amountInCents = 2300; break; // Science & Engineering ($23.00)
    case '2': amountInCents = 2500; break; // Prince of Persia ($25.00)
    case '3': amountInCents = 2800; break; // Working in Public ($28.00)
    default: amountInCents = 2000;
  }

  try {
    // Create the PaymentIntent payload with Stripe's backend servers
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });

    // Send the client secret back to your frontend checkout panel
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

/**
 * Confirmation landing route
 */
app.get('/confirmation', function(req, res) {
  res.render('confirmation', {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

/**
 * Start server
 */
app.listen(3000, () => {
  console.log('Getting served on port 3000');
});