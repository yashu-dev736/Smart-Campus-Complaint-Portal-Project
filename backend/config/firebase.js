const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

let db;

try {
  if (!admin.apps?.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  db = admin.firestore();
  console.log('Firebase Firestore Connected Successfully!');
} catch (error) {
  console.error('Firebase Admin Initialization Error:', error.message);
}

// Export both admin and db
module.exports = { admin, db };