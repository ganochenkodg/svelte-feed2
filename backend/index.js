import Fastify from 'fastify';
import cors from '@fastify/cors';
import { initDB } from './db.js';
import gracefulShutdown from 'fastify-graceful-shutdown';

const fastify = Fastify({ logger: true });
await fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'HEAD', 'POST', 'DELETE', 'PUT'],
});
await fastify.register(gracefulShutdown);

const db = await initDB();

fastify.get('/posts', async () => {
  const rows = await db.all('SELECT * FROM posts ORDER BY created_at DESC');
  return rows.map((post) => ({
    ...post,
    files: post.files ? JSON.parse(post.files) : [],
  }));
});

fastify.post('/posts', async (req, reply) => {
  const { content, color, files } = req.body;
  if (!content) return reply.status(400).send({ error: 'Content is required' });

  const filesJson = JSON.stringify(files || []);
  await db.run('INSERT INTO posts (content, color, files) VALUES (?, ?, ?)', [
    content,
    color,
    filesJson,
  ]);
  reply.send({ success: true });
});

fastify.put('/posts/:id', async (req, reply) => {
  const { id } = req.params;
  const { content } = req.body;

  const result = await db.run('UPDATE posts SET content = ? WHERE id = ?', [
    content,
    id,
  ]);

  if (result.changes === 0) {
    return reply.status(404).send({ error: 'Post not found' });
  }

  reply.send({ success: true });
});

fastify.delete('/posts/:id', async (req, reply) => {
  const { id } = req.params;
  const result = await db.run('DELETE FROM posts WHERE id = ?', [id]);

  if (result.changes === 0) {
    return reply.status(404).send({ error: 'Post not found' });
  }

  reply.send({ success: true });
});

fastify.listen({ port: 3000, host: '0.0.0.0' });
