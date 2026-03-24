# Dhurandhar: The Revenge - Event & Venue Booking App

A premium, full-stack event and venue booking application built with React, Vite, and Firebase. This app features a high-end "BookMyShow" style experience with real-time booking, navigation, and admin management.

## 🚀 Features

- **Event Discovery**: Browse high-quality movies, concerts, and sports events.
- **Venue Booking**: Book luxury hotels and open-air concert grounds.
- **Real-Time Bookings**: Instant ticket confirmation with seat selection and food add-ons.
- **Smart Navigation**: "Get Directions" button for confirmed bookings using Google Maps.
- **Admin Dashboard**: Manage events, venues, and view all bookings in real-time.
- **Location-Aware**: Filter events and venues based on your current city.
- **Glassmorphism UI**: Modern, high-performance interface with smooth Framer Motion animations.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend/DB**: Firebase (Firestore & Authentication)
- **Payments**: Stripe Integration (Optional)

## 📦 Getting Started

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd <your-repo-name>
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Firebase
Create a `src/firebase-applet-config.json` file with your Firebase credentials:
```json
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_AUTH_DOMAIN",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_STORAGE_BUCKET",
  "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
  "appId": "YOUR_APP_ID",
  "firestoreDatabaseId": "(default)"
}
```

### 4. Set Environment Variables
Create a `.env` file in the root directory:
```env
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
GEMINI_API_KEY=your_gemini_key
```

### 5. Run the Development Server
```bash
npm run dev
```
This will start both the Express backend and the Vite frontend concurrently.

## 🏗️ Project Structure

- `server.ts`: Express backend serving API routes and Vite middleware.
- `src/`: React frontend source code.
- `src/firebase.ts`: Firebase initialization and helper functions.
- `firestore.rules`: Security rules for the Firestore database.
- `firebase-blueprint.json`: Data structure definition for the project.

This app is optimized for deployment on **Vercel**, **Netlify**, or **Cloud Run**.
1. Build the project: `npm run build`
2. Deploy the `dist/` folder.

## 🛡️ Security Rules

Make sure to deploy the `firestore.rules` file to your Firebase project to ensure data security and proper access control.

---
Built with ❤️ using AI Studio.
