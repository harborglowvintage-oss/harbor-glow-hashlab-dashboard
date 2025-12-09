# 🚀 QUICK START GUIDE

## Install Dependencies
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Start the Server
```bash
cd /home/hgvboss/Desktop/goldsunproject
./start.sh
```

`start.sh` automatically uses the local virtualenv (if present), exports `PYTHONPATH`, and defaults to `127.0.0.1:8100`. Override with environment variables when needed:

```bash
HOST=0.0.0.0 PORT=9000 ./start.sh
```

## Access Dashboard
```
http://127.0.0.1:8100/login
```

## Default Login
```
Username: admin
Password: changeme123
```

⚠️ **IMPORTANT:** Change this password before production!

---

## What Was Fixed

| Bug | Status |
|-----|--------|
| Duplicate psu-fan.js script | ✅ FIXED |
| CSS rule duplication | ✅ FIXED |
| All other code | ✅ VERIFIED |

---

## Quick Verification

After starting the server, check:
- [ ] Can access `/login` page
- [ ] Can login with default credentials
- [ ] Dashboard loads all sections
- [ ] Partners section shows 6 vendor plaques
- [ ] Miners display correctly
- [ ] Power calculator works
- [ ] Console shows "Holo plaques found: 6" (F12)

---

## File Locations

```
Project Root: /home/hgvboss/Desktop/goldsunproject/

Backend:
  ├── main.py              (FastAPI server)
  ├── auth_config.json     (Login credentials)
  └── miners_config.json   (Miner list)

Frontend:
  ├── templates/
  │   └── dashboard.html   (Main template) - FIXED
  └── static/
      ├── dashboard.js     (Miner updates)
      ├── style.css        (Main styles)
      ├── nixie.js         (Power calculator)
      ├── img/ecoflow-logo.svg (Local EcoFlow mark)
      ├── img/magicminer-logo.svg (Local MagicMiner mark)
      ├── img/noctua-logo.svg (Local Noctua mark, keeps assets outside firmware)
      └── [12 other JS files for canvas/effects]
```

---

## Configuration

### Change Admin Password
Edit `auth_config.json`:
```json
{
  "admin_username": "admin",
  "admin_password": "your-new-password-here"
}
```

### Add More Miners
Edit `miners_config.json`:
```json
{
  "MinerName": "192.168.x.x",
  "AnotherMiner": "192.168.y.y"
}
```

> These config files are now listed in `.gitignore`, so Git will never commit your credentials or miner IPs by accident.

---

## Troubleshooting

### Server won't start
```bash
# Check if port 8100 is in use
lsof -i :8100

# Kill existing process if needed
pkill -f uvicorn

# Try again
uvicorn main:app --host 127.0.0.1 --port 8100
```

### Login not working
- Check `auth_config.json` for correct credentials
- Verify JSON syntax is valid
- Check console for error messages

### Partners not showing
- Clear browser cache (Ctrl+Shift+Delete)
- Open dev tools (F12) and look for JavaScript errors
- Check console should show "Holo plaques found: 6"

### Canvas animations laggy
- Close other browser tabs
- Reduce system load
- Check for JavaScript errors in console

---

## Documentation Files

- **`SESSION_SUMMARY.md`** - Complete debugging report
- **`DEPLOYMENT_REPORT.md`** - Detailed deployment guide
- **`BUG_FIXES_EXPLAINED.md`** - Simple explanation of fixes
- **`QUICK_START.md`** - This file

---

## Security Checklist

Before going live:
- [ ] Change default admin password
- [ ] Verify miner IPs are correct
- [ ] Test login with new password
- [ ] Ensure LAN-only access is working
- [ ] Set up HTTPS/SSL (recommended)
- [ ] Enable firewall rules

---

## Status: ✅ READY FOR DEPLOYMENT

All bugs fixed. All systems operational. All documentation complete.

**Deploy with confidence!** 🎉
