/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Product } from './types';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*', // Change '*' to 'chrome-extension://<your-extension-id>' for strict security
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const path = new URL(request.url).pathname;
		const method = request.method;

		// 1. Handle CORS preflight requests
		if (method.toUpperCase() === 'OPTIONS') {
			return new Response(null, {
				headers: corsHeaders,
			});
		}

		if (path === '/products') {
			const limit = new URL(request.url).searchParams.get('count');

			const { meta, results, success, error } = await env.DB.prepare(
				`SELECT * FROM amazon_products ORDER BY saved_at DESC ${limit ? 'LIMIT ' + Number(limit) : ''}`,
			).all();

			if (error || !success) {
				return Response.json({ error }, { status: 500, headers: { ...corsHeaders } });
			}

			console.info(meta);

			return Response.json(results, { status: 200, headers: { ...corsHeaders } });
		}

		if (path === '/save' && method.toUpperCase() === 'POST') {
			const data: Product = await request.json();

			const { meta, results, success, error } = await env.DB.prepare(
				`
				INSERT INTO amazon_products (asin, title, image_url, product_url, price, rating, reviews_count, attributes)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				ON CONFLICT(asin) DO UPDATE SET title=excluded.title, image_url=excluded.image_url, product_url=excluded.product_url, price=excluded.price, rating=excluded.rating, reviews_count=excluded.reviews_count, attributes=excluded.attributes;
			`,
			)
				.bind(
					data.asin,
					data.title,
					data.imageUrl,
					data.productUrl,
					data.price,
					data.rating,
					data.reviewsCount,
					JSON.stringify(data.attributes),
				)
				.run();

			if (error || !success) {
				return Response.json({ error, success }, { status: 500, headers: { ...corsHeaders } });
			}

			return Response.json({ success, results, meta, error }, { status: 201, headers: { ...corsHeaders } });
		}

		return new Response('Hello World!', { status: 200, headers: { ...corsHeaders } });
	},
} satisfies ExportedHandler<Env>;
