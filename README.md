## 🚀 Amigos Deployment Guide

Let's guide you through setting up the project locally, to deploy and test Amigos! Note that our app is built to run on iOS devices / iOS simulator, hence you will need a MacBook to run this app.


### 🔑 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**:
  - We recommend using the latest LTS version. You can download this from [nodejs.org](https://nodejs.org/).
  - This will also install `npm`.
- **Homebrew**: In your terminal, run:
  ```bash
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  ```
- **Git**: In your terminal, run:
  ```bash
  brew install git
  ```
- **Expo CLI**: In your terminal, run:
  ```bash
  npm install -g expo-cli
  ```
- **Xcode (iOS Simulator)**:
  - Download [Xcode](https://apps.apple.com/us/app/xcode/id497799835) from the Mac App Store.
  - Once installed, launch Xcode so that it can complete its first launch and finish its initial setup.
  - When prompted, select iOS under Platform Support to ensure that you download the iOS Simulator.
  - Alternatively, download it from: Xcode > Settings > Components > Platform Support.


### 🔧 Installation & Setup

1.  **Clone the repository**: Open your terminal and navigate to the directory where you want to store the project. Then run:

    ```bash
    git clone https://github.com/reynabxr/Amigos.git
    cd Amigos
    ```

2.  **Install dependencies**: In the Amigos directory, run:
    ```bash
    npm install
    ```


### 🔥 Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Click **Create a Firebase Project** and follow the prompts to create a new project.

2. **Add a Web App**
   - In your Firebase project dashboard, click the **Web** icon (`</>`) to add a new web app.
   - Enter an app nickname.
   - Skip the "Set up Firebase Hosting" step.

3. **Get Your Firebase Config**
   - After registering your app, you’ll see the Firebase SDK snippet.
   - Select the **npm** tab.
   - Copy the values from the `firebaseConfig` object (e.g., `apiKey`, `authDomain`, etc.).

4. **Set Up Your Environment Variables**
   - In your project root, copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Paste the values you copied from Firebase into your `.env` file, matching the format given in .env.example. 


### 🗺️ Foursquare Places API Setup

1. **Create a Foursquare Developer Account**
   - Go to [Foursquare Developers](https://foursquare.com/developers/home) and sign up for a new account or log in.

2. **Find Your Bearer Token**
   - Visit the [Foursquare Places API Reference](https://docs.foursquare.com/fsq-developers-places/reference/place-search).
   - At the top right of the page under Credentials, you’ll see your **Bearer** token. 
   - Copy the entire key.

3. **Set Up Your Foursquare Config**
   - In your project, copy `foursquareConfig.example.ts` to `foursquareConfig.ts`.
     ```bash
     cp services/foursquareConfig.example.ts services/foursquareConfig.ts
     ```
   - Open `foursquareConfig.ts` and paste your Bearer token, including the `Bearer` prefix.
  

### 📱 Running the App on iOS simulator (Recommended)

1.  **Start the development server**: In the Amigos directory, run:
    ```bash
    npm start
    ```

2.  **Open the iOS simulator**:
    - Press `i` to open the iOS simulator and run the app. 
    

### 📱 Running the App on your iOS device (Alternative)

1.  **Enable Developer Mode on your iPhone**:
    - Navigate to Settings > Privacy & Security > Developer Mode > Enable. You will be prompted to restat your device and confirm the activation. 
    - Connect your iPhone to your MacBook and click "Trust". 
    - Open Xcode > Window > Devices and Simulators > Devices, and ensure that your device is connected.

2. **Start the development server**: In the Amigos directory, run:
    ```bash
    npx expo run:ios --device
    ```

2.  **Select your device**:
    - Select the device that you wish to run the app on. It should be the first one listed. 
    - Press Enter and wait for the app to build.
    - The app should automatically download and run on your device.
