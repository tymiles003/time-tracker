import { createStore } from 'redux';

import timeTracker from './timeTracker';
import { pageLoad } from './actions';
import { CURRENT_VERSION } from './version';
import History from '../utils/History';

const DEFAULT_STATE = {
  selectedTask: null,
  lastTickTime: -1,
  newItemId: null,
  themeColor: 'purple',
  tasks: [],
  version: CURRENT_VERSION
};

const STORAGE_KEY = 'savedState';

export default (function() {
  var lastSaveTime = 0;

  function loadState() {
    var state = window.localStorage.getItem(STORAGE_KEY);

    try {
      state = JSON.parse(state);
    } catch (e) {
      console.log(e);
      state = undefined;
    }

    lastSaveTime = +new Date();

    return History.wrap(state || DEFAULT_STATE);
  }

  function saveState() {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(History.unwrap(store.getState()))
    );
    lastSaveTime = +new Date();
  }

  const startSaveTimeout = (function () {
    var timeoutId = null;

    return () => {
      var timeSinceLastSave = (+new Date()) - lastSaveTime;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Save immediately if updates are infrequent
      // Also prevents blocking caused by high-frequency changes
      if (timeSinceLastSave > 10000) {
        saveState();
        return;
      }

      timeoutId = setTimeout(saveState, 1000);
    }
  }());

  const store = createStore(timeTracker, loadState());

  store.subscribe(startSaveTimeout);

  store.dispatch(pageLoad());

  window.addEventListener("beforeunload", saveState);

  window.resetAllAppData = function() {
    if (window.confirm("This will delete all data, forever. Are you sure?")) {
      window.removeEventListener("beforeunload", saveState);
      delete localStorage[STORAGE_KEY];
      window.location.reload();
    }
  };

  return store;
}());