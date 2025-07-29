# TalentChainPro Frontend

This is the frontend application for TalentChainPro, a blockchain-based talent management platform built on Hedera Hashgraph.

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable React components
│   ├── pages/         # Page components
│   ├── services/      # API and blockchain services
│   ├── utils/         # Utility functions
│   ├── styles/        # CSS and styling files
│   └── index.js       # Application entry point
├── public/            # Static assets
└── package.json       # Dependencies and scripts
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## Backend Integration

The frontend communicates with the backend API running on `http://localhost:8000`. Make sure the backend server is running before starting the frontend development.

## Blockchain Integration

This application integrates with Hedera Hashgraph for:
- Skill token management
- Talent pool operations
- Smart contract interactions

## Development Notes

- The application uses React 18 with functional components and hooks
- Web3 integration for blockchain interactions
- Axios for API calls to the backend
- React Router for navigation
- MetaMask integration for wallet connectivity
