import { desc, eq } from "drizzle-orm";
import { db } from "..";
import { feedFollows, posts } from "../../schema";

export async function createPost(
	title: string,
	url: string,
	feedId: string,
	description?: string,
	publishedAt?: Date,
) {
	await db
		.insert(posts)
		.values({ title, url, feedId, description, publishedAt })
		.onConflictDoNothing();
}

export async function getPostsForUser(userId: string, limit: number) {
	const results = await db
		.select({
			id: posts.id,
			title: posts.title,
			url: posts.url,
			description: posts.description,
			publishedAt: posts.publishedAt,
			feedId: posts.feedId,
		})
		.from(posts)
		.innerJoin(feedFollows, eq(posts.feedId, feedFollows.feedId))
		.where(eq(feedFollows.userId, userId))
		.orderBy(desc(posts.publishedAt))
		.limit(limit);
	return results;
}
