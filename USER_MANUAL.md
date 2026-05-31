# QuickSewa User Manual

Welcome to **QuickSewa**, a multilingual CivicTech platform designed to make reporting civic issues simple, fast, and accessible for everyone.

---

## 1. System Overview

QuickSewa allows citizens to report civic grievances (like potholes, overflowing garbage, or broken streetlights) in under a minute. The platform uses:
* **Multilingual support** (English and Telugu) for maximum accessibility.
* **Automatic GPS geolocation** to pinpoint issues on a map.
* **AI analysis** (via Google Gemini 1.5 Flash Vision) to analyze photos and auto-fill category details.
* **Supabase** for secure and scalable backend data and photo storage.

---

## 2. Setting Up & Running the Application

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** (v9 or higher)
* A **Supabase** project (with Storage bucket and database setup)
* A **Google Gemini API Key**

### Installation
1. Clone the repository and install dependencies:
   ```bash
   git clone https://code.swecha.org/VishalBorra/hackathon_30-5-26.git
   cd hackathon_30-5-26
   npm install
   ```
2. Configure your environment variables in `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required configurations:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 3. Key Feature Walkthrough

### 3.1 Language Selection
On visiting the homepage, you can toggle between **English** and **Telugu** using the language switch button in the header. The entire UI instantly updates to the chosen language.

### 3.2 Reporting an Issue
1. **Upload Photo**: Click "Upload Photo" (or "ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക" / "ఫోటో అప్‌లోడ్ చేయండి") and select a photo of the civic grievance.
2. **AI Analysis**: The platform automatically sends the image to Google Gemini API to analyze the image, detect the issue, and categorize it (e.g., Pothole, Broken Streetlight, Sewage Overflow).
3. **Capture Location**: Ensure your browser's location permission is enabled. QuickSewa automatically captures the latitude and longitude of where you are reporting from.
4. **Submit Report**: Click the "Submit" button. Your report will be saved to Supabase and instantly shown on the public map.

### 3.3 Public Map & Community Verification
* Navigate to the **Map** tab to view all currently active civic grievances.
* Click on pins to see details, category, description, and status.
* Community members can click the "Upvote" or "Confirm" button on any pin to indicate that they also experience this issue, raising its priority level for ward officers.

---

## 4. Database Setup

To set up the required tables in Supabase, execute the queries in `schema_migration.sql` in the Supabase SQL Editor. This sets up the `reports` table with support for:
* `id` (uuid)
* `created_at` (timestamptz)
* `title` (text)
* `description` (text)
* `category` (text)
* `image_url` (text)
* `latitude` (double precision)
* `longitude` (double precision)
* `upvotes` (integer)
* `status` (text)
