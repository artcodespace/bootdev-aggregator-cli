import { readConfig, setUser } from "./config";
import { fetchFeed } from "./lib/fetchFeed";
import {
	createFeedFollows,
	deleteFeedFollows,
	getFeedFollowsForUser,
} from "./lib/queries/feedFollows";
import { createFeed, getFeedByUrl, getFeeds } from "./lib/queries/feeds";
import {
	createUser,
	deleteAllUsers,
	getUser,
	getUsers,
} from "./lib/queries/users";
import { getPostsForUser } from "./lib/queries/posts";
import { scrapeFeeds } from "./lib/scrapeFeeds";
import { feeds, users } from "./schema";

type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
type UserCommandHandler = (
	cmdName: string,
	user: User,
	...args: string[]
) => Promise<void>;
type middlewareLoggedIn = (handler: UserCommandHandler) => CommandHandler;

export const middlewareLoggedIn: middlewareLoggedIn = (handler) => {
	return async function wrappedFn(cmdName: string, ...args: string[]) {
		const currentUserName = readConfig().currentUserName;

		if (!currentUserName) {
			throw new Error("no user name configured");
		}

		const currentUser = await getUser(currentUserName);

		if (!currentUser) {
			throw new Error("no current user found");
		}

		await handler(cmdName, currentUser, ...args);
	};
};

export async function handlerLogin(cmdName: string, ...args: string[]) {
	if (args.length !== 1) {
		console.error("login requires a single username argument");
		process.exit(1);
	}
	const userName = args[0];
	const user = await getUser(userName);

	if (!user) {
		console.error("can not log in with unknown user");
		process.exit(1);
	}

	setUser(userName);
	console.log("user set to:", userName);
}

export async function handlerRegister(cmdName: string, ...args: string[]) {
	if (args.length !== 1) {
		console.error("register requires a single name argument");
		process.exit(1);
	}
	const userName = args[0];
	const userData = await createUser(userName);
	setUser(userName);
	console.log("user created:", userName, userData);
}

export async function handlerReset(cmdName: string, ...args: string[]) {
	await deleteAllUsers();

	console.log("all users deleted");
}

export async function handlerUsers(cmdName: string, ...args: string[]) {
	const users = await getUsers();
	const currentUserName = readConfig().currentUserName;

	users.forEach((u) => {
		if (u.name === currentUserName) {
			console.log(`* ${u.name} (current)`);
		} else {
			console.log(`* ${u.name}`);
		}
	});
}

export async function handlerAgg(cmdName: string, ...args: string[]) {
	if (args.length !== 1) {
		console.error("agg requires a single time_between_reqs argument");
		process.exit(1);
	}

	const timeBetweenRequests = parseDuration(args[0]);
	console.log(`Collecting feeds every ${args[0]}`);

	scrapeFeeds().catch(console.error);

	const interval = setInterval(() => {
		scrapeFeeds().catch(console.error);
	}, timeBetweenRequests);

	await new Promise<void>((resolve) => {
		process.on("SIGINT", () => {
			console.log("Shutting down feed aggregator...");
			clearInterval(interval);
			resolve();
		});
	});
}
function parseDuration(durationStr: string): number {
	const regex = /^(\d+)(ms|s|m|h)$/;
	const match = durationStr.match(regex);
	if (!match) {
		console.error("invalid duration format, use e.g. 1s, 1m, 1h");
		process.exit(1);
	}
	const value = parseInt(match[1]);
	const unit = match[2];
	const multipliers: Record<string, number> = {
		ms: 1,
		s: 1000,
		m: 60000,
		h: 3600000,
	};
	return value * multipliers[unit];
}

export async function handlerAddFeed(
	cmdName: string,
	user: User,
	...args: string[]
) {
	if (args.length !== 2) {
		console.error("addfeed must be called with two arguments, name and url");
		process.exit(1);
	}

	const [name, url] = args;

	const result = await createFeed(name, url, user.id);

	if (!result) {
		console.error("unable to create feed");
		process.exit(1);
	}

	await createFeedFollows(user.id, result.id);
	printFeed(result, user);
}

export type Feed = typeof feeds.$inferSelect;
export type User = typeof users.$inferSelect;
function printFeed(f: Feed, u: User) {
	console.log(f, u);
}

export async function handlerFeeds(cmdName: string, ...args: string[]) {
	const users = await getUsers();
	const result = await getFeeds();

	result.forEach((feed) => {
		const feedOwnerId = feed.userId;
		const feedOwnerName = users.find((u) => u.id === feedOwnerId);
		const nameToDisplay = feedOwnerName?.name ?? "unknown";
		console.log({ ...feed, ownerName: nameToDisplay });
	});
}

export async function handlerFollow(
	cmdName: string,
	user: User,
	...args: string[]
) {
	if (args.length !== 1) {
		console.error("handleFollow must be given a single url argument");
		process.exit(1);
	}

	const followUrl = args[0];
	const feed = await getFeedByUrl(followUrl);

	if (!feed) {
		console.error("unable to find feed with url", followUrl);
		process.exit(1);
	}

	const result = await createFeedFollows(user.id, feed.id);
	console.log("now following:");
	console.log(result.userName, "->", result.feedName);
}

export async function handlerFollowing(
	cmdName: string,
	user: User,
	...args: string[]
) {
	const result = await getFeedFollowsForUser(user.id);
	result.forEach((r) => {
		console.log(r.feedName);
	});
}

export async function handlerUnfollow(
	cmdName: string,
	user: User,
	...args: string[]
) {
	const followUrl = args[0];

	if (!followUrl) {
		console.error("must provide a feedUrl");
		process.exit(1);
	}

	const feed = await getFeedByUrl(followUrl);

	if (!feed) {
		console.error("unable to find feed with url", followUrl);
		process.exit(1);
	}

	await deleteFeedFollows(user.id, feed.id);
}

export async function handlerBrowse(
	cmdName: string,
	user: User,
	...args: string[]
) {
	const limit = args[0] ? parseInt(args[0]) : 2;
	const posts = await getPostsForUser(user.id, limit);
	posts.forEach((p) => {
		console.log(`${p.title}\n  ${p.url}\n`);
	});
}

export type CommandsRegistry = Record<string, CommandHandler>;

export function registerCommand(
	registry: CommandsRegistry,
	cmdName: string,
	handler: CommandHandler,
) {
	registry[cmdName] = handler;
}

export async function runCommand(
	registry: CommandsRegistry,
	cmdName: string,
	...args: string[]
) {
	if (cmdName in registry) {
		const handler = registry[cmdName];
		await handler(cmdName, ...args);
	}
}
