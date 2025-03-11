import { createRouter, createWebHistory } from 'vue-router'
import EditorPage from '../views/EditorPage.vue'
import PreviewPage from '../components/PreviewPage.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'editor',
            component: EditorPage
        },
        {
            path: '/preview',
            name: 'preview',
            component: PreviewPage
        }
    ]
})

export default router 