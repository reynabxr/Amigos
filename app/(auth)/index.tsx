import { useRouter } from 'expo-router';
import {
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';


const logoImage = require('../../assets/images/amigosLogo.png'); 

export default function Index() {
  const router = useRouter();
  const handleSignIn = () => {
    console.log('push to sign in')
    router.push('/login');
  };

  const handleCreateAccount = () => {
    router.push('/signup');
  };

  return (
    <View style={styles.rootContainer}>
      <SafeAreaView style={styles.safeAreaContainer}>
        <StatusBar barStyle="light-content" />

        <View style={styles.contentContainer}>
          {/* logo */}
          <View style={styles.logoSection}>
            <Image source={logoImage} style={styles.logo} resizeMode="contain" />
            <Text style={styles.appName}>Amigos</Text>
            <Text style={styles.tagline}>Plan Less, Live More</Text>
          </View>

          <View style={styles.spacer} />

          {/* sign in button */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSignIn}
            >
              
              <Text style={styles.buttonText}>SIGN IN</Text>
            </TouchableOpacity>
          </View>

          {/* create account link */}
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
  rootContainer: {
    flex: 1,
    backgroundColor: '#ec787c', 
  },
  safeAreaContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', 
    paddingHorizontal: 30,
    paddingBottom: 40, 
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60, 
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40, 
  },
  logo: {
    width: 450, 
    height: 300, 
    marginBottom: 5,
  },
  appName: {
    fontSize: 60,
    fontWeight: 'bold',
    color: 'white', 
    fontFamily: 'SansitaSwashed', 
    marginBottom: 5,
  },
  tagline: {
    fontSize: 18,
    color: 'white', 
    fontFamily: 'SansitaSwashed', 
  },
  spacer: {
    flex: 0.8, 
  },
  buttonSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20, 
  },
  button: {
    flexDirection: 'row', 
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: 'white', 
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  
  buttonText: {
    color: 'white', 
    fontSize: 14,
    fontWeight: '600',
  },
  bottomLinkButton: {
    paddingVertical: 10, 
  },
  bottomLinkText: {
    color: 'white', 
    fontSize: 14,
    fontWeight: '500',
  },
});