# LIVORA Website — Navigation and Demo Login Fix

## Run locally

This project is static HTML/CSS/JavaScript. From this folder you can use a local static server, for example:

```powershell
npx serve .
```

Or deploy the contents of this folder to Netlify as a static site. The main page is `index.html`; no build command is required for the static version.

## Demo login

Choose **Create account**, enter a valid email and a password of at least 6 characters, then sign in with those same details. This is a browser-local demonstration only, not secure authentication. Do not use a real or reused password. Clearing browser storage removes the local demo account.

## Pages

Overview, Digital balance, Activity, History & trends, Smart band, and Settings each have their own page view and working navigation buttons. Data is stored locally in this browser.

## Limitations

- Website pages cannot automatically read all installed-app usage statistics; Android Usage Access requires a native Android implementation and user permission.
- Smart-band live readings are not implemented. Browser Bluetooth support varies and requires matching ESP32 BLE GATT services/characteristics.
- Scores and manually entered activity/usage are educational demo values, not medical assessments.
- `style.css` is retained from the source archive; the current premium page styling is embedded in `index.html`.
