import { objApp } from './firebase-app.js';

import { 
   onSnapshot, addDoc, setDoc, 
   doc, getDoc, query, where
} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';

import {  
   GoogleAuthProvider, signInWithRedirect,
   onAuthStateChanged, signOut 
} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';

const currentyApp = objApp();

currentyApp.dataStorage = (() => {
   const loginBtn = document.querySelector('[data-target="modal-login"]');
   const signInWithGoogleBtn = document.querySelector('[data-js="button-form"]');
   const ulPhrases = document.querySelector('[data-js="phrases-list"]');
   const addPhraseOptionLi = document.querySelector('[data-target="modal-add-phrase"]');
   const addPhraseForm = document.querySelector('[data-js="add-phrase-form"]');
   const accountDetailsEl = document.querySelector('[data-js="account-link"]');
   const logoutEl = document.querySelector('[data-js="logout"]');
   const msgLoginEl = document.querySelector('#initialMsg');
   const liToCloseEl = document.querySelector('[data-js="logged-out"]');
   const lisToOpenEl = document.querySelectorAll('[data-js="logged-in"]');

   let data = [];

   return {
      loginBtn,
      signInWithGoogleBtn,
      ulPhrases,
      addPhraseOptionLi,
      addPhraseForm,
      accountDetailsEl,
      logoutEl,
      msgLoginEl,
      liToCloseEl,
      lisToOpenEl,
      setData (querySnapshoot) { 
         data = [...querySnapshoot.docs]; 
      },
      getData () { 
         return data; 
      },
   };
})();

currentyApp.errorFeedback = error => console.log(error);
currentyApp.logoutUser = () => currentyApp.handleWithLoginAndLogout(false);

currentyApp.accesData = validDocs => 
   onSnapshot(validDocs, currentyApp.handleData, currentyApp.errorFeedback);

currentyApp.openLoginModal = () => 
   currentyApp.handleModal('[data-js="modal-login"]', true);

currentyApp.openAddPhraseModal = () => 
   currentyApp.handleModal('#modal-add-phrase', true);

currentyApp.createEl = (el, atributes, doc) => {
   const movie = doc.data().movie;
   const phrase = doc.data().phrase;
   const element = document.createElement(el);

   const setAtt = array => {
      const att = array[0];
      const val = array[1];
   
      element.setAttribute(att, val);
   };
   atributes.forEach(setAtt);
   
   atributes[0][0] === 'data-phrase' ? 
      element.textContent = phrase : element.textContent = movie;

   return element;
};

currentyApp.createAndRenderContent = (doc, i) => {
   const { createEl, dataStorage } = currentyApp;

   const atributesMovies = [
      ['class', 'movieItem'], ['data-movie', `${i}`],
   ];
   const atributesPhrase = [
      ['data-phrase', `${i}`], ['data-count', 'count'],
      ['class', 'phraseItem removeLi'],
   ];

   const liMovie = createEl('li', atributesMovies, doc);
   const liPhrase = createEl('li', atributesPhrase, doc);
   
   dataStorage.ulPhrases.append(liMovie, liPhrase);
};

currentyApp.handleData =  querySnapshoot => {
   const { ulPhrases, setData, getData } = currentyApp.dataStorage;

   ulPhrases.innerHTML = '';

   setData(querySnapshoot);
   
   const docs = getData();
   docs.forEach(currentyApp.createAndRenderContent);
};

currentyApp.cleanAndFocus = event => {
   const { 
      title: inputTitle, 
      phrase: inputPhrase 
   } = event.target;

   inputTitle.value = '';
   inputTitle.focus();
   inputPhrase.value = '';
   inputPhrase.focus();
};

currentyApp.handleModal = (selector, isToOpen) => {
   const modal = document.querySelector(`${selector}`);
   const instances = M.Modal.init(modal);

   isToOpen ? instances.open() : instances.close();
};

currentyApp.setEvent = params => {   
   const [ 
      array, logged, loginEls, 
      el, addPhraseForm 
   ] = params;

   const func =  array[1];
   const action = 'click';

   if(!loginEls){
      const action = el === addPhraseForm ? 'submit' : 'click';

      !logged ? el.removeEventListener(action, func) 
         : el.addEventListener(action, func);
      return;
   };

   !logged ? el.addEventListener(action, func) 
      : el.removeEventListener(action, func);
};

currentyApp.handleWithListeners = function (logged) {
   const {
      loginBtn, signInWithGoogleBtn, ulPhrases, 
      addPhraseOptionLi, addPhraseForm,
      logoutEl, accountDetailsEl, 
   } = this.dataStorage;

   const handleWithEvent = array => {
      const el = array[0];
      const loginEls = el === loginBtn || el === signInWithGoogleBtn;

      const args = [array, logged, loginEls, el, addPhraseForm];
      this.setEvent(args);
   };

   const eventListenersArr = [ 
      [loginBtn, this.openLoginModal], [logoutEl, this.logoutUser],
      [accountDetailsEl, this.handleShowAccountDetail], 
      [addPhraseForm, this.handleAddMoviePhraseSubmit],
      [addPhraseOptionLi, this.openAddPhraseModal],
      [signInWithGoogleBtn, this.showLoginPopup], 
      [ulPhrases, this.showMoviePhrase], 
   ];
   eventListenersArr.forEach(handleWithEvent);
};

currentyApp.showOrHideEl = (isToRender, show, isLogged) => {
   const { msgLoginEl, liToCloseEl, lisToOpenEl } = currentyApp.dataStorage;
   
   isToRender ? msgLoginEl.classList.remove('msgLoginRemove') 
      : msgLoginEl.classList.add('msgLoginRemove');

   const action = show ? 'show' : 'hide';
   liToCloseEl.setAttribute('class', action);

   const showOrHideOptions = li => {
      if(isLogged){
         li.setAttribute('class', 'show');
         return;
      };
      li.setAttribute('class', 'hide');
   };

   lisToOpenEl.forEach(showOrHideOptions); 
};

currentyApp.setInitialInfos = logged => {
   if(!logged){
      currentyApp.showOrHideEl(true, true, false);
      currentyApp.handleWithListeners(false);
      currentyApp.dataStorage.ulPhrases.innerHTML = '';
      return;
   };
   currentyApp.showOrHideEl(false, false, true);
   currentyApp.handleWithListeners(true);
};

currentyApp.handleWithLoginAndLogout = async function (isLogged) {
   if(isLogged){
      try{
         const { uid, displayName, email } = this.auth.currentUser;

         const userRef = doc(this.db, 'users', uid);
         const docSnapshot = await getDoc(userRef);

         if(!docSnapshot.exists()){
            await setDoc(userRef, {
               name: DOMPurify.sanitize(displayName),
               email: DOMPurify.sanitize(email),
               userId: DOMPurify.sanitize(uid),
            });
         };

      }catch(error){
         console.log(error);
      };

      this.setInitialInfos(true);
      return;
   };
   this.setInitialInfos(false);

   const [error] = await this.to(signOut(this.auth));
   error ? console.log(error) : '';
};

currentyApp.handleShowAccountDetail = function () {
   const { displayName, email } = currentyApp.auth.currentUser;

   const userName = DOMPurify.sanitize(displayName); 
   const userEmail = DOMPurify.sanitize(email); 

   const accountInfosEl = document.querySelector('[data-js="account-details"]');
   accountInfosEl.innerHTML = '';

   const infosParagraph = document.createElement('p');
   infosParagraph.textContent = 
      `${userName} | ${userEmail}`;

   accountInfosEl.append(infosParagraph);
   currentyApp.handleModal('#modal-account', true); 
};

currentyApp.addNewMoviePhrase = async function (movie, phrase) {
   const userId = this.auth.currentUser.uid;
   const newDataObjectDoc = { 
      movie, 
      phrase, 
      userId: DOMPurify.sanitize(userId),
   };
   const [ error ] = await this.to(addDoc(this.collPhrases, newDataObjectDoc));

   error ? console.log(error) : this.handleModal('#modal-add-phrase', false);
};

currentyApp.handleAddMoviePhraseSubmit = event => {
   event.preventDefault();

   const movie = DOMPurify.sanitize(event.target.title.value);
   const phrase = DOMPurify.sanitize(event.target.phrase.value);
   
   currentyApp.addNewMoviePhrase(movie, phrase);
   currentyApp.cleanAndFocus(event);
};

currentyApp.showMoviePhrase = event => {
   const liMovie = event.target.dataset.movie;
   if(!liMovie){return};

   const renderPhraseContent = (el, i) => {
      const phraseToShow = i === Number(liMovie);
   
      if(phraseToShow){
         el.classList.toggle('removeLi');
         return;
      };
      el.classList.add('removeLi');
   };

   const lis = document.querySelectorAll('[data-count="count"]');
   lis.forEach(renderPhraseContent);
};

currentyApp.handleAcces = function (user) {
   const selector = '[data-js="modal-login"]';
   
   if(!user){
      this.handleWithLoginAndLogout(null);
      return;
   };
   this.handleWithLoginAndLogout(true);
   this.handleModal(selector, null);

   const userId = this.auth.currentUser.uid;
   const validDocs = query(this.collPhrases, where('userId', '==', userId));
   this.accesData(validDocs);
};

currentyApp.showLoginPopup = async function () {
   const provider = new GoogleAuthProvider();

   const [ error ] = await currentyApp
      .to(signInWithRedirect(currentyApp.auth, provider));

   if(error){
      console.log(error);
      this.handleAcces(null);
   };
};

currentyApp.initApp = async function () {
   try{
      await onAuthStateChanged(this.auth, user =>
         user ? this.handleAcces(true) : this.handleAcces(null));

   }catch(error){
      console.log(error);
   };
};

currentyApp.dataStorage.loginBtn
   .addEventListener('click', currentyApp.openLoginModal);

currentyApp.dataStorage.signInWithGoogleBtn
   .addEventListener('click', currentyApp.showLoginPopup);

currentyApp.initApp();