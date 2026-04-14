import { createRouter, createWebHistory } from 'vue-router'
import Test from '../views/Test.vue'
import Home from '../views/Home.vue'

const routes = [
    {
        path: '/',
        name: 'home',
        component: Home
    },
    {
        path: '/test',
        name: 'test',
        component: Test
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes

})
router.beforeEach((to) => {
    document.title = to.name;
})

export default router