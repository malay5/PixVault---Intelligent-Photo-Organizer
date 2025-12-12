# PixelVault

PixelVault is a self-hosted, "Google Photos" clone designed for privacy and ease of organization. It features automatic face clustering, album management, and a seamless photo browsing experience.

## ✨ Features

*   **Smart Organization**: Automatically groups photos by faces (People & Pets).
*   **Fast Browsing**: Responsive masonry grid for thousands of photos.
*   **Albums**: Create and manage albums easily.
*   **Privacy First**: All ML processing happens locally. No data leaves your server.
*   **Search**: Find photos by date, location, or person.

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18+)
*   Python (v3.9+)
*   MongoDB (Running locally or accessible via URI)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/pixelvault.git
    cd pixelvault
    ```

2.  **Install Dependencies**
    ```bash
    # Install root dependencies
    npm install
    
    # Install Frontend dependencies
    cd main_app/frontend
    npm install
    
    # Install Backend dependencies
    cd ../backend
    npm install
    
    # Install ML Service dependencies
    cd ../../ml_service
    pip install -r requirements.txt
    ```

3.  **Environment Setup**
    *   Ensure MongoDB is running on `mongodb://localhost:27017/pixelvault` (or update `.env` in `main_app/backend`).

### Running the App

We provide a convenient script to start all services (Frontend, Backend, ML Service, Monitoring) at once.

```bash
# From the root directory 'pixelvault'
npm run dev
```

*   **Frontend**: [http://localhost:3000](http://localhost:3000)
*   **Backend API**: [http://localhost:5000](http://localhost:5000)
*   **Monitoring Dashboard**: [http://localhost:5173](http://localhost:5173)
*   **ML Service**: [http://localhost:8000](http://localhost:8000)

## 📸 Screenshots

### Home - Photo Grid
![Home Page](./screenshots/home.png)
*Browse all your memories in a clean grid.*

### Albums
![Albums Page](./screenshots/albums.png)
*Organize your photos into collections.*

### People & Pets
![People Page](./screenshots/people.png)
*Automatic face clustering identifies the people that matter most.*

### Login
![Login Page](./screenshots/login.png)
*Secure access to your personal vault.*

## 🏗 Architecture

*   **Frontend**: Next.js 14 (App Router), TailwindCSS, Lucide Icons.
*   **Backend**: Node.js, Express, MongoDB, Multer (Local Storage).
*   **ML Service**: FastAPI, Python (Mock FaceNet implementation).
*   **Monitoring**: React + Vite for real-time system stats.

