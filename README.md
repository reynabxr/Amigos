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


### 📱 Running the App on iOS simulator (Recommended)

1.  **Start the development server**: In the Amigos directory, run:
    ```bash
    npx expo run:ios --device
    ```

2.  **Select your device**:
    - Select the device that you wish to run the app on. Navigate using the arrow keys.
    - Press Enter and wait for the app to build. 
    - The app should automatically download and run on the iOS simulator.
    

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
