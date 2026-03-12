# PRD: PooPals (The Social Health Tracker for Dogs)

## 1. Project Overview
PooPals is a "vibe-coded" social utility app that allows dog owners to track their pet's digestive health via AI photo analysis and share status updates with a "Pack" of friends.

## 2. Core Features

### A. Dog Profile Management
* **Fields:** Name, Breed, Age, Weight, Primary Food Brand.
* **Goal:** Establish a baseline for AI health comparisons.

### B. AI "ScatScan" (Gemini API Integration)
* **Workflow:** User takes/uploads a photo -> Image sent to Gemini API -> Result returned.
* **Analysis Parameters:**
    * **Consistency:** (e.g., Hard, Ideal, Soft, Diarrhea) based on the Bristol Stool Scale.
    * **Color:** (e.g., Chocolate Brown, Yellow/Orange, Bloody, Dark/Black).
    * **Anomalies:** Detection of visible grass, plastic, or parasites.
    * **Health Score:** A generated 1-10 rating.
* **Output:** A "Report Card" with a playful summary (e.g., "The Golden Standard!").

### C. Social "Dog Park"
* **Friends List:** Search and add other users/dogs.
* **Status Feed:** A timeline of "Business Trips" (poop logs). 
* **Privacy Toggle:** Users can choose to share just the "Score" or the "Photo + Score" with friends.

---

## 3. Technical Stack (Antigravity Optimization)
* **Framework:** Next.js 15 (App Router).
* **Styling:** Tailwind CSS + Shadcn/UI for that "clean" aesthetic.
* **Database/Auth:** Supabase (PostgreSQL for profiles/friends, Storage for images).
* **AI:** Google Gemini API (`gemini-3.0-flash` for speed and cost-efficiency).
* **State Management:** React Server Components + TanStack Query.

## 4. AI Prompt Logic (The "Vibe" Guide)
The system prompt for Gemini should be:
> "You are a specialized veterinary assistant. Analyze this image of dog waste. Provide a JSON response containing: 'consistency' (1-7 scale), 'color' (hex code and name), 'objects_detected' (boolean), and a 'summary' (max 15 words, humorous tone)."

---

## 5. User Flow
1. **Open App** -> **Press "Log Business"** -> **Camera Opens**.
2. **AI Processes** -> **Shows Result Screen** -> **User adds optional note (e.g., 'Ate a sock again')**.
3. **Post to Feed** -> **Friends can 'Paws Up' (Like) or Comment**.