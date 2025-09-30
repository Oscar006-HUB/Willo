// Organization Registration
app.post('/api/org/register', async (req, res) => {
  const { orgName, orgEmail, orgPhone, contributionNumber, contributorCount } = req.body;
  
  try {
    // Generate organization credentials
    const orgId = `WILLO-ORG-${Date.now().toString(36).toUpperCase()}`;
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Save organization
    const orgResult = await pool.query(
      `INSERT INTO organizations (org_id, name, email, phone, contribution_number, contributor_count, password_hash) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [orgId, orgName, orgEmail, orgPhone, contributionNumber, contributorCount, hashedPassword]
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
    
    // Send credentials email
    await transporter.sendMail({
      from: `"Willo" <${process.env.GMAIL_USER}>`,
      to: orgEmail,
      subject: 'Your Willo Organization Credentials',
      html: `
        <h2>Welcome to Willo!</h2>
        <p>Your organization has been registered successfully.</p>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Organization ID:</strong> ${orgId}</p>
          <p><strong>Password:</strong> ${tempPassword}</p>
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

// Contributor Login
app.post('/api/contributor/login', async (req, res) => {
  const { contributorId, password } = req.body;
  
  try {
    const result = await pool.query(
      'SELECT c.id, c.password_hash, o.contribution_number, o.name as org_name FROM contributors c JOIN organizations o ON c.org_id = o.org_id WHERE c.contributor_id = $1',
      [contributorId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid Contributor ID' });
    }
    
    const valid = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    const token = jwt.sign(
      { 
        contributorId, 
        orgContributionNumber: result.rows[0].contribution_number,
        orgName: result.rows[0].org_name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Contributor Dashboard
app.get('/api/contributor/dashboard', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get contributor payments
    const payments = await pool.query(
      `SELECT period, status, amount FROM contributions 
       WHERE contributor_id = (SELECT id FROM contributors WHERE contributor_id = $1)
       ORDER BY period DESC`,
      [decoded.contributorId]
    );
    
    res.json({
      organization: {
        name: decoded.orgName,
        contributionNumber: decoded.orgContributionNumber
      },
      payments: payments.rows
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});