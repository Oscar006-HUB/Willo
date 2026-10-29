# Willo

Web app for organizations to track and manage member contributions.

> Status: in development — not deployed.

## Features
- Organization sign-up, login and dashboard
- Contributor login and personal contribution dashboard
- Admin page for oversight
- Backend endpoints for organization registration (with emailed temporary credentials), JWT-protected dashboards and Stripe payment intents

## Tech stack
- Front end: HTML, CSS, vanilla JavaScript
- Back end: Node.js + Express, JSON Web Tokens, Nodemailer (Gmail), Stripe
- Database: SQL (`organizations.sql`)

## Project structure
| File | Purpose |
|---|---|
| `index.html`, `about.html`, `help.html` | Public pages |
| `org-signup.html`, `org-login.html`, `org-dashboard.html` | Organization flow |
| `contributor-login.html`, `contributor-dashboard.html` | Contributor flow |
| `admin page.html` | Admin view |
| `server.js`, `Backend API Endpoints.js`, `Backend Dashboard Endpoint.js`, `Stripe Payment Intent.js` | Express route handlers |
| `organizations.sql` | Database SQL |

## Running locally
The front end is static: open `index.html` in a browser.

The back-end files are route handlers that still need to be wired into one Express app. They expect these environment variables:

```
JWT_SECRET=
GMAIL_USER=
CLIENT_URL=
```
plus your database and Stripe credentials.

## License

Released under the [GNU AGPL v3](LICENSE.md).
