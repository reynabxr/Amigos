import {
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet, // Added View for the root container
  Text,
  TouchableOpacity,
  View, // Added View for the root container
} from 'react-native';

// Make sure this path is correct relative to this file
const logoImage = require('../../assets/images/amigosLogo.png'); // Adjust if needed

// Define placeholder functions for onPress handlers
const handleSignInWithGoogle = () => {
  console.log('Sign In with Google pressed');
  // Add Google Sign-In logic and navigation here
};

const handleCreateAccount = () => {
  console.log('Create Account pressed');
  // Add navigation to create account screen here
};

const Index = () => {
  return (
    // REPLACED LinearGradient with a View and a solid background color
    <View style={styles.rootContainer}>
      <SafeAreaView style={styles.safeAreaContainer}>
        <StatusBar barStyle="light-content" />

        <View style={styles.contentContainer}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Image source={logoImage} style={styles.logo} resizeMode="contain" />
            <Text style={styles.appName}>Amigos</Text>
            <Text style={styles.tagline}>Plan Less, Live More</Text>
          </View>

          {/* Spacer View to push content appropriately */}
          <View style={styles.spacer} />

          {/* Button Section */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSignInWithGoogle}
            >
              
              <Text style={styles.buttonText}>SIGN IN WITH GOOGLE</Text>
            </TouchableOpacity>
          </View>

          {/* Create Account Link */}
          <TouchableOpacity
            style={styles.bottomLinkButton}
            onPress={handleCreateAccount}
          >
            <Text style={styles.bottomLinkText}>
              No account? Create an account!
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  // RENAMED and MODIFIED: gradientContainer to rootContainer
  rootContainer: {
    flex: 1,
    backgroundColor: '#EA4080', 
  },
  safeAreaContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
    paddingHorizontal: 30,
    paddingBottom: 40, // Padding at the bottom
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60, // Padding at the top
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40, // Space below the logo section
  },
  logo: {
    width: 450, // Adjust size as needed
    height: 300, // Adjust size as needed
    marginBottom: 5,
  },
  appName: {
    fontSize: 60,
    fontWeight: 'bold',
    color: 'white', // This will work well on a darker background
    fontFamily: 'SansitaSwashed', // Make sure this font is loaded
    marginBottom: 5,
  },
  tagline: {
    fontSize: 18,
    color: 'white', // This will work well on a darker background
    fontFamily: 'SansitaSwashed', // Make sure this font is loaded
  },
  spacer: {
    flex: 0.8, // This will push the logo to the top and buttons/link to the bottom
  },
  buttonSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20, // Space above the "No account?" link
  },
  button: {
    flexDirection: 'row', // To allow icon and text side-by-side
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: 'white', // White border might look good on a colored background
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  
  buttonText: {
    color: 'white', // White text for the button
    fontSize: 14,
    fontWeight: '600',
  },
  bottomLinkButton: {
    paddingVertical: 10, // Make it easier to tap
  },
  bottomLinkText: {
    color: 'white', // White text for the link
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Index;
