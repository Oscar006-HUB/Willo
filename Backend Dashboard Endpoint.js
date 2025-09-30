// Contributor Dashboard with Currency Support
app.get('/api/contributor/dashboard', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get contributor payments with currency info
    const payments = await pool.query(
      `SELECT period, status, amount, currency, currency_symbol 
       FROM contributions 
       WHERE contributor_id = (SELECT id FROM contributors WHERE contributor_id = $1)
       ORDER BY period DESC`,
      [decoded.contributorId]
    );
    
    // Get organization currency info
    const orgInfo = await pool.query(
      'SELECT name, contribution_number, currency, currency_symbol FROM organizations WHERE org_id = $1',
      [decoded.orgId]
    );
    
    const org = orgInfo.rows[0] || {
      name: 'Your Organization',
      contribution_number: '+233 XXX XXX XXX',
      currency: 'GHS',
      currency_symbol: '₵'
    };
    
    res.json({
      organization: {
        name: org.name,
        contributionNumber: org.contribution_number,
        currency: org.currency,
        currencySymbol: org.currency_symbol
      },
      payments: payments.rows
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update JWT payload to include currency info
// In your contributor login endpoint:
const token = jwt.sign(
  { 
    contributorId, 
    orgId: result.rows[0].org_id,
    orgName: orgResult.rows[0].name,
    orgContributionNumber: orgResult.rows[0].contribution_number,
    orgCurrency: orgResult.rows[0].currency,
    orgCurrencySymbol: orgResult.rows[0].currency_symbol
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);