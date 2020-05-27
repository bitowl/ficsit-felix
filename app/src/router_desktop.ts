import Vue from 'vue';
import Router from 'vue-router';
import EditorView from './components/desktop/EditorView.vue';
import MainScreen from './components/desktop/MainScreen.vue';
import LoadEditorView from './components/core/LoadEditorView.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landingpage',
      component: MainScreen
    },

    {
      path: '/loadeditor',
      name: 'loadEditor',
      component: LoadEditorView,
      meta: {
        requiresDataLoaded: true
      }
    },
    {
      path: '/editor',
      name: 'editor',
      component: EditorView,
      meta: {
        requiresDataLoaded: true
      }
    },
    {
      path: '*',
      name: '404',
      component: MainScreen
    }
  ]
});
