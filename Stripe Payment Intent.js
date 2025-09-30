// Create payment intent with organization currency
app.post('/api/create-payment-intent', async (req, res) => {
  const { amount } = req.body;
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get organization currency
    const org = await pool.query(
      'SELECT currency FROM organizations WHERE org_id = $1',
      [decoded.orgId]
    );
    
    const currency = org.rows[0]?.currency || 'GHS';
    const amountInCents = Math.round(amount * 100); // Convert to smallest currency unit
    
    // Create payment intent with correct currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      description: `Contribution for ${decoded.contributorId}`,
      meta {
        contributorId: decoded.contributorId,
        orgId: decoded.orgId
      }
    });
    
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      currency: currency
    });
  } catch (err) {
    console.error('Payment intent error:', err);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});