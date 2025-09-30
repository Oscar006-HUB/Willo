// Organization Registration with Currency Support
app.post('/api/org/register', async (req, res) => {
  const { 
    orgName, 
    orgEmail, 
    orgPhone, 
    contributionNumber, 
    contributorCount,
    country = 'GH',
    currency = 'GHS',
    currencySymbol = '₵'
  } = req.body;
  
  try {
    // Generate organization credentials
    const orgId = `WILLO-ORG-${Date.now().toString(36).toUpperCase()}`;
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Save organization with currency info
    const orgResult = await pool.query(
      `INSERT INTO organizations 
       (org_id, name, email, phone, contribution_number, contributor_count, password_hash, country, currency, currency_symbol) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [orgId, orgName, orgEmail, orgPhone, contributionNumber, contributorCount, hashedPassword, country, currency, currencySymbol]
    );
    
    // Generate contributor IDs
    const contributorCountNum = parseInt(contributorCount);
    const contributors = [];
    for (let i = 0; i < contributorCountNum; i++) {
      const contribId = `WILLO-${orgId.split('-')[2]}-${String(i+1).padStart(5, '0')}`;
      contributors.push({
        contributor_id: contribId,
        temp_password: tempPassword,
        org_id: orgId
      });
    }
    
    // Save contributors
    for (const contrib of contributors) {
      await pool.query(
        `INSERT INTO contributors (contributor_id, password_hash, org_id) 
         VALUES ($1, $2, $3)`,
        [contrib.contributor_id, hashedPassword, orgId]
      );
    }
    
    // Send credentials email with currency info
    await transporter.sendMail({
      from: `"Willo" <${process.env.GMAIL_USER}>`,
      to: orgEmail,
      subject: 'Your Willo Organization Credentials',
      html: `
        <h2>Welcome to Willo!</h2>
        <p>Your organization has been registered successfully with <strong>${currencySymbol} (${currency})</strong> as your currency.</p>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Organization ID:</strong> ${orgId}</p>
          <p><strong>Password:</strong> ${tempPassword}</p>
          <p><strong>Currency:</strong> ${currencySymbol} (${currency})</p>
        </div>
        <h3>Contributor Credentials</h3>
        <p>Distribute these credentials to your ${contributorCountNum} contributors:</p>
        <table border="1" style="border-collapse: collapse; width: 100%; margin: 15px 0;">
          <tr>
            <th>Contributor ID</th>
            <th>Password</th>
          </tr>
          ${contributors.map(c => `
            <tr>
              <td>${c.contributor_id}</td>
              <td>${tempPassword}</td>
            </tr>
          `).join('')}
        </table>
        <p>Login to your dashboard: <a href="${process.env.CLIENT_URL}/org-dashboard.html">Organization Dashboard</a></p>
      `
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Org registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});