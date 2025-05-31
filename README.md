## 🚀 Getting Started

This section will guide you through setting up the project locally, to deploy and test our app!

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: We recommend using the latest LTS version. You can download it from [nodejs.org](https://nodejs.org/).
- **npm** (Node Package Manager) or **Yarn**: These come with Node.js or can be installed separately.
- **Git**: For cloning the repository.
- **Expo CLI**: While `npx expo` can be used for many commands, having the global CLI can be handy.
  ```bash
  npm install -g expo-cli
  ```
- **(Optional but Recommended for EAS)** **EAS CLI**: For building and submitting your app.
  ```bash
  npm install -g eas-cli
  ```
- **Expo Go App**: Install the Expo Go app on your iOS or Android physical device for easy testing.
  - [Expo Go for Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - [Expo Go for iOS](https://apps.apple.com/us/app/expo-go/id982107779)
- **(Optional for Emulators/Simulators)**
  - **Android Studio**: For Android emulators.
  - **Xcode**: (macOS only) For iOS simulators.

### 🔧 Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/reynabxr/Amigos.git
    cd Amigos
    ```

2.  **Install dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using Yarn:
    ```bash
    yarn install
    ```

### 📱 Running the App (Development & Local Testing)

Once the dependencies are installed, you can run the app locally for development and testing:

1.  **Start the development server:**
    Using npm:

    ```bash
    npm start
    ```

    Or using Yarn:

    ```bash
    yarn start
    ```

    This will also work:

    ```bash
    npx expo start
    ```

2.  **The Metro Bundler will open in your browser or terminal.** You'll see a QR code and options to run the app:
    - **On a physical device (Recommended for quick testing):**
      - Open the Expo Go app on your Android or iOS device.
      - Scan the QR code displayed in the terminal or browser.
    - **On an Android Emulator:**
      - Ensure your Android Emulator is running.
      - Press `a` in the terminal where Metro Bundler is running.
    - **On an iOS Simulator (macOS only):**
      - Ensure your iOS Simulator is running.
      - Press `i` in the terminal where Metro Bundler is running.
    - **In a Web Browser:**
      - Press `w` in the terminal where Metro Bundler is running. (Note: Web support might require additional configuration or packages depending on your app's features).
