import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import MissionMapView from './views/MissionMapView.vue'
import ModuleView from './views/ModuleLearningView.vue'
import SummaryView from './views/SummaryView.vue'
import TeacherDashboardView from './views/TeacherDashboardView.vue'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/missions', name: 'missions', component: MissionMapView },
    { path: '/missions/:id', name: 'module', component: ModuleView },
    { path: '/summary', name: 'summary', component: SummaryView },
    { path: '/teacher', name: 'teacher', component: TeacherDashboardView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
