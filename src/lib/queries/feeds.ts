import { eq, sql } from "drizzle-orm";
import { db } from "..";
import { feeds } from "../../schema";

export async function createFeed(name: string, url: string, userId: string) {
	const [result] = await db
		.insert(feeds)
		.values({ name, url, userId })
		.returning();
	return result;
}

export async function markFeedFetched(id: string) {
	const result = await db
		.update(feeds)
		.set({ lastFetchedAt: new Date(), updatedAt: new Date() })
		.where(eq(feeds.id, id));
	return result;
}

export async function getNextFeedToFetch() {
	const [result] = await db
		.select()
		.from(feeds)
		.orderBy(sql`${feeds.lastFetchedAt} ASC NULLS FIRST`)
		.limit(1);
	return result;
}

export async function getFeeds() {
	const result = await db.select().from(feeds);
	return result;
}

export async function getFeedByUrl(url: string) {
	const [result] = await db.select().from(feeds).where(eq(feeds.url, url));
	return result;
}
