import { XMLParser } from "fast-xml-parser";

type RSSFeed = {
	channel: {
		title: string;
		link: string;
		description: string;
		item: RSSItem[];
	};
};

type RSSItem = {
	title: string;
	link: string;
	description: string;
	pubDate: string;
};

export async function fetchFeed(feedUrl: string): Promise<RSSFeed> {
	const res = await fetch(feedUrl);
	const data = await res.text();

	const parser = new XMLParser();
	const { rss } = parser.parse(data);

	if (!rss.channel) {
		throw new Error("unable to find RSSFeed channel");
	}

	const { channel } = rss;

	if (!channel.title || !channel.link || !channel.description) {
		throw new Error("unable to find RSSFeed channel metadata");
	}

	let items: RSSItem[] = [];
	if ("item" in channel) {
		if (Array.isArray(channel.item)) {
			items = [...channel.item];
		}
	}

	items = items.filter((i) => {
		return i.title && i.link && i.description && i.pubDate;
	});

	const { title, link, description } = channel;
	return {
		channel: {
			title,
			link,
			description,
			item: items,
		},
	};
}
