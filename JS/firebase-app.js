import { 
   initializeApp 
} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js';

import { 
   getFirestore, collection,
} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';

import {  
   getAuth
} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';

function objApp () {
   const firebaseConfig = {
      apiKey: 'AIzaSyCTD9LZT-ni8dwXeE4oaE1xYT7vF6yWNoU',
      authDomain: 'auth-71bd5.firebaseapp.com',
      projectId: 'auth-71bd5',
      storageBucket: 'auth-71bd5.appspot.com',
      messagingSenderId: '539993209438',
      appId: '1:539993209438:web:b123fe8bb4d7f3c10992cf',
   };
   const app = initializeApp(firebaseConfig);
   const db = getFirestore(app);
   const collPhrases = collection(db, 'moviesPhrases');
   const auth = getAuth(app);

   return {
      app,
      db,
      collPhrases,
      auth,
      to (promise) { 
         return promise
            .then(response => [null, response])
            .catch(error => [error])
      },
   };
};

export { objApp };