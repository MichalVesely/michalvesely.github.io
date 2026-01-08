const Stripe = require('stripe');
const { AuthService } = require('./auth');

class StripeHandler {
  constructor() {
    this.stripe = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY)
      : null;
    this.authService = new AuthService();
  }

  isConfigured() {
    return this.stripe !== null;
  }

  async createCheckoutSession(userId, userEmail, priceId, returnUrl) {
    if (!this.stripe) {
      throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        customer_email: userEmail,
        client_reference_id: userId.toString(),
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}?canceled=true`,
        subscription_data: {
          metadata: {
            user_id: userId.toString(),
          },
        },
      });

      return session;
    } catch (error) {
      console.error('Stripe checkout session creation failed:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  async createCustomerPortalSession(customerId, returnUrl) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      console.error('Stripe portal session creation failed:', error);
      throw new Error('Failed to create portal session');
    }
  }

  async handleWebhook(payload, signature) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      throw new Error('Webhook signature verification failed');
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancellation(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailure(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  async handleCheckoutComplete(session) {
    const userId = parseInt(session.client_reference_id);
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    await this.authService.updateSubscription(
      userId,
      'pro',
      customerId,
      subscriptionId,
      'active'
    );

    console.log(`Subscription activated for user ${userId}`);
  }

  async handleSubscriptionUpdate(subscription) {
    const userId = subscription.metadata.user_id;

    if (userId) {
      const status = subscription.status;
      const tier = status === 'active' ? 'pro' : 'free';

      await this.authService.updateSubscription(
        parseInt(userId),
        tier,
        subscription.customer,
        subscription.id,
        status
      );

      console.log(`Subscription updated for user ${userId}: ${status}`);
    }
  }

  async handleSubscriptionCancellation(subscription) {
    const userId = subscription.metadata.user_id;

    if (userId) {
      await this.authService.updateSubscription(
        parseInt(userId),
        'free',
        subscription.customer,
        subscription.id,
        'canceled'
      );

      console.log(`Subscription canceled for user ${userId}`);
    }
  }

  async handlePaymentSuccess(invoice) {
    console.log(`Payment succeeded for invoice ${invoice.id}`);
  }

  async handlePaymentFailure(invoice) {
    console.log(`Payment failed for invoice ${invoice.id}`);
  }

  // Create a price in Stripe (run this once during setup)
  async createPrice(productName, amount, currency = 'usd') {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    // Create product
    const product = await this.stripe.products.create({
      name: productName,
      description: 'SimLap Pro - Unlimited AI-powered telemetry analysis'
    });

    // Create price
    const price = await this.stripe.prices.create({
      product: product.id,
      unit_amount: amount, // in cents
      currency: currency,
      recurring: {
        interval: 'month',
      },
    });

    console.log('Created price:', price.id);
    return price;
  }
}

module.exports = new StripeHandler();
