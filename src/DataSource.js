// noinspection ES6CheckImport
import {initializeApp} from "firebase/app";
// noinspection ES6CheckImport
import {getAuth, onAuthStateChanged, signInAnonymously} from "firebase/auth";
// noinspection ES6CheckImport
import {getDatabase} from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBzRnMig_BoFRALB0Aro-Zk3xPTTLT4DXI",
    authDomain: "python-zendo.firebaseapp.com",
    databaseURL: "https://python-zendo-default-rtdb.firebaseio.com",
    projectId: "python-zendo",
    storageBucket: "python-zendo.appspot.com",
    messagingSenderId: "1078959710744",
    appId: "1:1078959710744:web:f87097149476e5a148196d",
    measurementId: "G-SVNXNWKY35"
};


class DataSource {
    connect = () => {
        // Initialize Firebase
        initializeApp(firebaseConfig);
        this.database = getDatabase();
        const auth = getAuth();
        signInAnonymously(auth);
        let dataSource = this;
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in
                dataSource.userId = user.uid;
            } else {
                // User is signed out
                dataSource.userId = undefined;
            }
        });

    }
}

export default DataSource;
