# SosPos → Sydney Microsoldering

**Version:** 4.5 · **Sites:** app.sospos.com.au · sydneymicrosoldering.com.au

A floating button on SOS POS that sends microsoldering repair tickets to Sydney Microsoldering with one click. Auto-fills the support ticket form on their site so you don't have to re-enter any details.

---

## What It Does

### On SOS POS (app.sospos.com.au)

- Adds a floating **Sydney** button in the bottom-left corner of the screen
- Click it while viewing a ticket — it opens the Sydney Microsoldering support portal in a new tab
- Passes ticket details (customer name, ticket number, fault description) to the new tab automatically

### On Sydney Microsoldering (sydneymicrosoldering.com.au)

- Reads the ticket data passed from SOS POS
- Auto-fills the support request form (device type, fault, store contact)
- Shows a confirmation step before submitting — it will not submit without your review

---

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) in Chrome
2. Click **Raw** on the `.user.js` file in this repo
3. Tampermonkey will prompt to install — click **Install**
4. Open any ticket in SOS POS — the floating **Sydney** button appears in the bottom-left corner

---

## Notes

> **Phone number** is currently hardcoded to the Coffs Harbour store (`0266992869`). If you need an editable phone number field in the UI, open an Issue and it will be added.

- Uses `GM_openInTab` to open Sydney Microsoldering in a new tab
- Auto-submit includes a confirmation step — nothing is submitted without your approval

---

## Using Multiple Scripts

If you are using several of the THVjQ Tampermonkey scripts, check the **Issues** tab — a multi-script addon with live updates across all scripts is in progress. Leave a comment and it will be prioritised.
