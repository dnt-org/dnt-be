// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, set, get, push, onValue, off, remove, update } = require("firebase/database");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDJTNBF9RcIoAFdFpd1ereDsZOUWnIRAWw",
  authDomain: "dnts-bd247.firebaseapp.com",
  databaseURL: "https://dnts-bd247-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dnts-bd247",
  storageBucket: "dnts-bd247.firebasestorage.app",
  messagingSenderId: "592533984741",
  appId: "1:592533984741:web:e24e80e5cb7f112eb70b0c",
  measurementId: "G-XHFEB7MDMR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Realtime Database helper functions
const realtimeDB = {
  // Write data to a specific path (overwrites existing data)
  writeData: async (path, data) => {
    try {
      await set(ref(database, path), data);
      console.log(`Data written successfully to ${path}`);
      return { success: true, path, data };
    } catch (error) {
      console.error('Error writing data:', error);
      return { success: false, error: error.message };
    }
  },

  // Read data once from a specific path
  readData: async (path) => {
    try {
      const snapshot = await get(ref(database, path));
      if (snapshot.exists()) {
        return { success: true, data: snapshot.val(), path };
      } else {
        return { success: true, data: null, path, message: 'No data found' };
      }
    } catch (error) {
      console.error('Error reading data:', error);
      return { success: false, error: error.message };
    }
  },

  // Push data with auto-generated key
  pushData: async (path, data) => {
    try {
      const newRef = await push(ref(database, path), data);
      console.log(`Data pushed successfully to ${path} with key: ${newRef.key}`);
      return { success: true, key: newRef.key, path, data };
    } catch (error) {
      console.error('Error pushing data:', error);
      return { success: false, error: error.message };
    }
  },

  // Update specific fields at a path (merges with existing data)
  updateData: async (path, updates) => {
    try {
      await update(ref(database, path), updates);
      console.log(`Data updated successfully at ${path}`);
      return { success: true, path, updates };
    } catch (error) {
      console.error('Error updating data:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete data at a specific path
  deleteData: async (path) => {
    try {
      await remove(ref(database, path));
      console.log(`Data deleted successfully from ${path}`);
      return { success: true, path };
    } catch (error) {
      console.error('Error deleting data:', error);
      return { success: false, error: error.message };
    }
  },

  // Listen to data changes in real-time
  listenToData: (path, callback) => {
    const dataRef = ref(database, path);
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : null;
      callback(data, snapshot.key);
    }, (error) => {
      console.error('Error listening to data:', error);
      callback(null, null, error);
    });
    
    // Return reference and unsubscribe function
    return {
      ref: dataRef,
      unsubscribe: () => off(dataRef)
    };
  },

  // Stop listening to data changes
  stopListening: (dataRef) => {
    if (dataRef && dataRef.ref) {
      off(dataRef.ref);
    } else {
      off(dataRef);
    }
  },

  // Get database reference for advanced operations
  getRef: (path) => ref(database, path),

  // Batch write operations
  batchWrite: async (operations) => {
    const results = [];
    try {
      for (const operation of operations) {
        const { type, path, data } = operation;
        let result;
        
        switch (type) {
          case 'set':
            result = await realtimeDB.writeData(path, data);
            break;
          case 'update':
            result = await realtimeDB.updateData(path, data);
            break;
          case 'push':
            result = await realtimeDB.pushData(path, data);
            break;
          case 'delete':
            result = await realtimeDB.deleteData(path);
            break;
          default:
            result = { success: false, error: `Unknown operation type: ${type}` };
        }
        
        results.push({ operation, result });
      }
      
      return { success: true, results };
    } catch (error) {
      console.error('Error in batch operations:', error);
      return { success: false, error: error.message, results };
    }
  },

  // Utility function to create timestamped data
  createTimestampedData: (data) => {
    return {
      ...data,
      createdAt: new Date().toISOString(),
      timestamp: Date.now()
    };
  },

  // Utility function to update with timestamp
  createUpdatedData: (data) => {
    return {
      ...data,
      updatedAt: new Date().toISOString(),
      lastModified: Date.now()
    };
  }
};


// Export database instance for advanced usage
module.exports = { database, realtimeDB };

// Test the connection
// realtimeDB.writeData("test/connection", {
//   message: "Firebase Realtime Database connected successfully",
//   timestamp: Date.now(),
//   createdAt: new Date().toISOString()
// }).then(result => {
//   if (result.success) {
//     console.log("✅ Firebase Realtime Database integration successful");
//   } else {
//     console.error("❌ Firebase Realtime Database connection failed:", result.error);
//   }
// });


// realtimeDB.listenToData("test/connection", (data) => {
//   console.log("Data changed:", data);
// });