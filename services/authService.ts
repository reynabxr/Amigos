import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    User
} from 'firebase/auth';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

// define type for user profile data
export interface UserProfile {
    uid: string;
    username: string;
    email: string | null;
    createdAt: Date;
}

interface AuthResponse {
    success: boolean;
    user?: User | null;
    profile?: UserProfile | null;
    error?: string;
    message?: string;
}

// signup auth logic
export const firebaseSignUp = async (
    username: string,
    email: string,
    password: string
): Promise<AuthResponse> => {
    try {
        // create user with firebase authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        if (firebaseUser) {
            // create user profile in firestore
            const firebaseProfile: UserProfile = {
                uid: firebaseUser.uid,
                username: username,
                email: firebaseUser.email,
                createdAt: new Date()
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