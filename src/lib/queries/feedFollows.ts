import { and, eq } from "drizzle-orm";
import { db } from "..";
import { feedFollows, feeds, users } from "../../schema";

export async function getFeedFollowsForUser(userId: string) {
	const results = await db
		.select({
			id: feedFollows.id,
			createdAt: feedFollows.createdAt,
			updatedAt: feedFollows.updatedAt,
			userName: users.name,
			feedName: feeds.name,
		})
		.from(feedFollows)
		.innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
		.innerJoin(users, eq(feedFollows.userId, users.id))
		.where(eq(users.id, userId));

	return results;
}

export async function createFeedFollows(userId: string, feedId: string) {
	const [newFeedFollow] = await db
		.insert(feedFollows)
		.values({ userId, feedId })
		.onConflictDoNothing();

	const [result] = await db
		.select({
			id: feedFollows.id,
			createdAt: feedFollows.createdAt,
			updatedAt: feedFollows.updatedAt,
			userName: users.name,
			feedName: feeds.name,
		})
		.from(feedFollows)
		.innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
		.innerJoin(users, eq(feedFollows.userId, users.id))
		.where(and(eq(feedFollows.userId, userId), eq(feedFollows.feedId, feedId)));

	return result;
}

export async function deleteFeedFollows(userId: string, feedId: string) {
	await db
		.delete(feedFollows)
		.where(and(eq(feedFollows.userId, userId), eq(feedFollows.feedId, feedId)));
}
