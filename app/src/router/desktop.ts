import Vue from 'vue';
import Router from 'vue-router';
import EditorView from '../components/desktop/EditorView.vue';
import WelcomeView from '../components/desktop/WelcomeView.vue';
import LoadEditorView from '../components/core/views/LoadEditorView.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landingpage',
      component: WelcomeView
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
      component: WelcomeView
    }
  ]
});