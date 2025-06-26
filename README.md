# Travel Admin Dashboard

A secure travel administration dashboard with dynamic API key injection for flight and hotel data management.

## 🔐 Security Features

- **No API keys in Git**: API keys are stored in `.env` file (ignored by Git)
- **Dynamic injection**: Keys are injected at runtime from environment variables
- **Template-based**: Uses `admin-dashboard.template.html` with placeholders
- **Generated dashboard**: Actual dashboard with keys is ignored by Git

## 🚀 Quick Start

1. **Create your `.env` file** with your API keys:
   ```bash
   # Firebase Configuration
   FIREBASE_API_KEY=your_firebase_api_key_here
   
   # FlightAware API Configuration
   FLIGHTAWARE_API_KEY=your_flightaware_api_key_here
   
   # TripAdvisor API Configuration
   TRIPADVISOR_API_KEY=your_tripadvisor_api_key_here
   ```

2. **Start all services**:
   ```bash
   ./start-services.sh
   ```

3. **Access your dashboard**:
   - Open: http://localhost:8000/admin-dashboard.html
   - All API keys will be automatically injected from your `.env` file

## 📁 File Structure

```
├── .env                           # Your API keys (ignored by Git)
├── .env.example                   # Template for environment variables
├── admin-dashboard.template.html  # Template with placeholders (tracked by Git)
├── admin-dashboard.html           # Generated dashboard with keys (ignored by Git)
├── start-services.sh              # Starts all services and injects keys
├── flight-proxy-server.js         # FlightAware API proxy server
├── hotel-proxy-server.js          # Hotel API proxy server
└── README.md                      # This file
```

## 🔧 How It Works

1. **Template System**: The `admin-dashboard.template.html` contains placeholders like `{{FIREBASE_API_KEY}}`
2. **Dynamic Injection**: `start-services.sh` reads your `.env` file and replaces placeholders with actual keys
3. **Generated Dashboard**: Creates `admin-dashboard.html` with real API keys injected
4. **Git Protection**: The generated file is ignored by Git, only the template is tracked

## 🛡️ Security Benefits

- ✅ **No secrets in Git history**: API keys never touch your repository
- ✅ **Environment-based**: Different keys for dev/staging/production
- ✅ **Team-friendly**: Each developer uses their own `.env` file
- ✅ **Proxy protection**: API keys can be kept server-side via proxy servers
- ✅ **Build-time injection**: Keys are injected only when needed

## 🌐 Available Services

When you run `./start-services.sh`, these services start:

- **FlightAware Proxy**: http://localhost:3001 (handles CORS and API key protection)
- **Hotel Proxy**: http://localhost:3002 (TripAdvisor and other hotel APIs)
- **Web Server**: http://localhost:8000 (serves the dashboard)
- **Admin Dashboard**: http://localhost:8000/admin-dashboard.html

## 🔄 Development Workflow

1. **Make changes** to `admin-dashboard.template.html`
2. **Run** `./start-services.sh` to regenerate with your API keys
3. **Commit** only the template file - never the generated dashboard
4. **Share** the template with team members safely

## 🚨 Important Notes

- Never commit your `.env` file or `admin-dashboard.html`
- Always use the template file for making changes
- API keys are injected fresh each time you start services
- For production, consider using proxy servers exclusively to keep keys server-side

## 🆘 Troubleshooting

**Dashboard shows placeholders instead of data:**
- Make sure your `.env` file exists and has the correct API keys
- Run `./start-services.sh` to regenerate the dashboard

**Services won't start:**
- Check that ports 3001, 3002, and 8000 are available
- Verify Node.js and Python are installed

**API calls failing:**
- Verify your API keys are correct in the `.env` file
- Check that proxy servers are running (they start automatically)