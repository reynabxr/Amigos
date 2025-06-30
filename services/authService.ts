import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    updateProfile,
    User,
} from 'firebase/auth';

import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

// define type for user profile data
export interface UserProfile {
    uid: string;
    username: string;
    email: string | null;
    createdAt: any;
    dietaryPreferences?: string[];
}

interface AuthResponse {
    success: boolean;
    user?: User | null;
    profile?: UserProfile | null;
    error?: string;
    message?: string;
}

// function to check if a username is already taken
export const isUsernameTaken = async (username: string): Promise<boolean> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; // returns true if username is taken
}

// signup auth logic
export const firebaseSignUp = async (
    username: string,
    email: string,
    password: string
): Promise<AuthResponse> => {
    try {
        // check if username is already taken
        if (await isUsernameTaken(username)) {
            return { 
                success: false, 
                error: 'Username is already taken.', 
                message: 'Please choose a different username.' 
            };
        }
        
        // create user with firebase authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        if (firebaseUser) {
            try {
                await updateProfile(firebaseUser, { displayName: username });
            } catch (profileError) {
                console.warn('Error updating profile:', profileError);
            }
            
            // create user profile in firestore
            const firebaseProfile: UserProfile = {
                uid: firebaseUser.uid,
                username: username,
                email: firebaseUser.email,
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(db, 'users', firebaseUser.uid), firebaseProfile);

            return { 
                success: true, 
                user: firebaseUser, 
                profile: firebaseProfile,
                message: 'User registered successfully!'
            };
        } else {
            return { 
                success: false, 
                error: 'User registration failed.' 
            };
        }
    } catch (error: any) {
        console.error('Firebase Signup Error:', error)
        return { 
            success: false, 
            error: error.message || 'An error occurred during signup.',
            message: error.code || error.message
        };
    }
};

// login auth logic
export const firebaseSignIn = async (
    email: string,
    password: string
): Promise<AuthResponse> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        if (firebaseUser) {
            // fetch user profile from firestore
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
                const profileData = userDoc.data() as UserProfile;
                return { 
                    success: true, 
                    user: firebaseUser, 
                    profile: profileData,
                    message: 'User signed in successfully!'
                };
            } else {
                return { 
                    success: false, 
                    error: 'User profile not found.' 
                };
            }
        } else {
            return { 
                success: false, 
                error: 'User login failed.' 
            };
        }
    } catch (error: any) {
        console.error('Firebase Login Error:', error)
        return { 
            success: false, 
            error: error.message || 'An error occurred during sign-in.',
            message: error.code || error.message
        };
    }
}

// update username
interface UpdateUsernameResponse {
    success: boolean;
    newUsername?: string;
    error?: string;
    message?: string;
}

export const updateUsername = async (
    userId: string,
    newUsername: string
): Promise<UpdateUsernameResponse> => {
    try {
        // check if new username is already taken
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', newUsername));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // check if the username is taken by another user (not the same user)
            let usernameTakenByOther = false;
            querySnapshot.forEach((docSnap) => {
                if (docSnap.id !== userId) {
                    usernameTakenByOther = true;
                }
            });
            if (usernameTakenByOther) {
                return { 
                    success: false, 
                    error: 'Username is already taken.', 
                    message: 'Please choose a different username.' 
                };
            }
        }

        // update user profile in firestore
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { username: newUsername }, { merge: true });

        // update firebase auth profile
        const user = auth.currentUser;
        if (user) {
            await updateProfile(user, { displayName: newUsername });
        }

        return { 
            success: true, 
            newUsername: newUsername,
            message: 'Username updated successfully!'
        };
    } catch (error: any) {
        console.error('Update Username Error:', error)
        return { 
            success: false, 
            error: error.message || 'An error occurred while updating the username.',
            message: error.code || error.message
        };
    }
};

// forgot password
export const firebaseForgotPassword = async (
    email: string
): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { 
            success: true, 
            message: 'Password reset email sent successfully!' 
        };
    } catch (error: any) {
        console.error('Firebase Forgot Password Error:', error)
        return { 
            success: false, 
            error: error.message || 'An error occurred while sending the password reset email.',
            message: error.code || error.message
        };
    }
};
