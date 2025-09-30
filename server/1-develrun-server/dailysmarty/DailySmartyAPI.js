// ============================================
// DailySmartyAPI.js - Posts API Manager
// ============================================
import fs from 'fs';

export class DailySmartyAPI {
    constructor(app, dbPath) {
        this.app = app;
        this.posts = this.loadPosts(dbPath);

        console.log('[DAILYSMARTY API] Initialized with', this.posts.length, 'posts');
    }

    loadPosts(dbPath) {
        try {
            const data = fs.readFileSync(dbPath, 'utf8');
            return JSON.parse(data).posts;
        } catch (error) {
            console.error('[DAILYSMARTY API] Error loading db.json:', error);
            return [];
        }
    }

    setupRoutes() {
        // GET /api/posts - All posts or filtered by title
        this.app.get('/api/posts', (req, res) => {
            const { title_like } = req.query;

            let results = this.posts;

            if (title_like) {
                results = this.posts.filter(post =>
                post.title.toLowerCase().includes(title_like.toLowerCase())
                );
            }

            console.log(`[DAILYSMARTY API] GET /api/posts - Returned ${results.length} posts`);
            res.json(results);
        });

        // GET /api/posts/:id - Single post
        this.app.get('/api/posts/:id', (req, res) => {
            const post = this.posts.find(p => p.id === parseInt(req.params.id));

            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            console.log(`[DAILYSMARTY API] GET /api/posts/${req.params.id}`);
            res.json(post);
        });

        console.log('[DAILYSMARTY API] Routes configured: /api/posts, /api/posts/:id');
    }

    getStats() {
        return {
            totalPosts: this.posts.length,
            endpoints: ['/api/posts', '/api/posts/:id']
        };
    }
}
