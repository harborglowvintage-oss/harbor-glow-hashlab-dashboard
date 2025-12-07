# Harbor Glow HashLab Dashboard

A secure, real-time dashboard for monitoring and managing Bitcoin miners. Built with FastAPI, Jinja2, and modern JavaScript/CSS. Designed for LAN and public deployment with strong security defaults.

---

## 🚀 Features
- Real-time miner stats: hashrate, temps, efficiency, power, shares
- Cyberpunk UI with animated gauges and fans
- Add/remove miners via web interface
- Secure login required for dashboard and API access
- LAN-only by default; external access requires HTTPS and authentication
- Miner IPs and sensitive config data never exposed to frontend
- Open-source friendly with MIT license

---

## 🔐 Security Highlights
- Login required for all routes (dashboard + API)
- LAN-only connections unless configured otherwise
- Passwords are hashed with `bcrypt`
- No secrets, IPs, or credentials stored in frontend
- All inputs and API data sanitized to prevent XSS/injection

---

## ⚙️ Quick Start

### 1. Install Dependencies
```bash
pip install fastapi uvicorn
```
### 2. Run the Server
```bash
uvicorn main:app --reload
# Or for LAN/public:
uvicorn main:app --host 0.0.0.0 --port 8000
```
### 3. Open the Dashboard
- Local: http://127.0.0.1:8000/
- LAN: http://<your-ip>:8000/

### 4. Login
- Default username: `admin`
- Default password: `changeme123`
- Change these in `auth_config.json` after first run.

---

## Configuration
- **Miners:** Edit `miners_config.json` or use the Add Miner panel.
- **Authentication:** Edit `auth_config.json` for your admin credentials.
- **Static assets:** Place images/fonts in `static/` as needed.

## Deployment
- For HTTPS, use a reverse proxy (nginx, Caddy) or FastAPI's SSL support.
- For public deployment, change all default passwords and review your firewall.

## License
MIT (recommended for open-source, but you may choose another license.)

## Contributing
PRs and issues welcome! See [github.com/harborglowvintage-oss](https://github.com/harborglowvintage-oss) for details.

---
**No miner firmware is ever modified. This dashboard is 100% safe for your hardware.**
