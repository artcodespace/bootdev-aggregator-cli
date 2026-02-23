import { fetchFeed } from "./fetchFeed";
import { createPost } from "./queries/posts";
import { getNextFeedToFetch, markFeedFetched } from "./queries/feeds";

export async function scrapeFeeds() {
	const feed = await getNextFeedToFetch();
	if (!feed) return;

	await markFeedFetched(feed.id);
	const fetched = await fetchFeed(feed.url);

	for (const item of fetched.channel.item) {
		const publishedAt = item.pubDate ? parseDate(item.pubDate) : undefined;
		await createPost(item.title, item.link, feed.id, item.description, publishedAt);
		console.log("saved post:", item.title);
	}
}

function parseDate(dateStr: string): Date | undefined {
	const d = new Date(dateStr);
	return isNaN(d.getTime()) ? undefined : d;
}
