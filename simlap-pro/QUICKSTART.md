# 🚀 SimLap Pro - 5 Minute Quickstart

Get your $1,000/month SaaS business running in 5 minutes.

---

## Step 1: Install Docker (2 minutes)

### Mac
```bash
# Download Docker Desktop from:
open https://www.docker.com/products/docker-desktop

# Install and start Docker Desktop
```

### Windows
```bash
# Download Docker Desktop from:
start https://www.docker.com/products/docker-desktop

# Install and start Docker Desktop
```

### Linux
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl start docker
```

---

## Step 2: Start Your Platform (1 minute)

```bash
cd simlap-pro
./setup.sh
```

**That's it!** Your platform is running at http://localhost

---

## Step 3: Test It (2 minutes)

1. Open http://localhost in your browser
2. Click "Sign Up"
3. Create an account
4. Click "Upload Telemetry"
5. Click "Create Demo Analysis"
6. See your analysis in seconds!

**It works!** 🎉

---

## Step 4: Enable Payments (Optional - 5 minutes)

### Get Stripe Keys
1. Sign up at https://stripe.com
2. Go to https://dashboard.stripe.com/apikeys
3. Copy your Secret Key

### Create Product
```bash
docker-compose exec backend node -e "
const stripe = require('./stripe-handler');
stripe.createPrice('SimLap Pro', 999, 'usd').then(price => {
  console.log('Add this to .env:', price.id);
});
"
```

### Update Configuration
Edit `.env`:
```bash
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PRICE_ID=price_from_above
```

### Restart
```bash
docker-compose restart
```

**Payments enabled!** Test with card: 4242 4242 4242 4242

---

## Step 5: Get Your First Customer (This Week)

### Post on Reddit (30 minutes)
Go to r/simracing and post:

```
Title: Built an AI tool that analyzes telemetry and shows exactly where you're losing time

Hey! I'm a sim racer who got frustrated trying to analyze telemetry in MoTeC.
So I built an AI tool that gives you specific coaching advice like:

"Brake 20m later into Turn 1 - potential 0.3s savings"
"Carry 5 km/h more through Turn 3 - potential 0.2s savings"

Works with any sim. Free tier available. Pro is $9.99/mo (way cheaper than alternatives).

Would love feedback from the community!
[your-link]
```

### Expected Results
- 100-500 views
- 10-30 signups
- 1-3 paying customers

**Congrats on your first customer!** 🎊

---

## Common Commands

```bash
# View logs
docker-compose logs -f

# Restart everything
docker-compose restart

# Stop platform
docker-compose down

# Start platform
docker-compose up -d

# Backup database
docker cp simlap-backend:/app/data/simlap.db ./backup.db
```

---

## What's Next?

1. **Week 1**: Get 5 paying customers through Reddit/Discord
2. **Week 2**: Create content (blog posts, videos)
3. **Week 3**: Start paid ads ($5/day)
4. **Week 4**: Reach $50/month revenue

**Repeat until you hit $1,000/month** (100 customers)

---

## Need Help?

Check the logs:
```bash
docker-compose logs -f
```

Everything you need is in:
- README.md - Full documentation
- BUSINESS_PLAN.md - Growth strategy

---

## Revenue Timeline

- **Month 1**: $50/month (5 customers)
- **Month 2**: $100/month (10 customers)
- **Month 3**: $250/month (25 customers)
- **Month 6**: $1,000/month (100 customers)

**You've got this!** 🏁
