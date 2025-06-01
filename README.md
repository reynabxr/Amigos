## 🚀 Amigos Deployment Guide

Let's guide you through setting up the project locally, to deploy and test Amigos! Note that our app is built to run on iOS devices. 

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
- **EAS CLI**: For building and submitting your app.
  ```bash
  npm install -g eas-cli
  ```
- **Xcode (Optional, for iOS Simulator)**:
  - Download Xcode from the Mac App Store.
  - After installation, open Xcode at least once. It will perform initial setup and install necessary components.

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

### 📱 Running the App (Development & Local Testing)

Once the dependencies are installed, you can run the app locally for development and testing:

1. **Connect your device**:
   - Ensure your iOS Simulator is running, or your iOS device is plugged in.
  
2.  **Start the development server**:
    ```bash
    npm expo run:ios --device
    ```

4.  **Select your device**:
    - Select the device that you wish to run the app on.
    - The app should automatically download and run on your device. 
