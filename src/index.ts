import {
	CommandsRegistry,
	handlerAddFeed,
	handlerAgg,
	handlerBrowse,
	handlerFeeds,
	handlerFollow,
	handlerFollowing,
	handlerLogin,
	handlerRegister,
	handlerReset,
	handlerUnfollow,
	handlerUsers,
	middlewareLoggedIn,
	registerCommand,
	runCommand,
} from "./handlers";

async function main() {
	const registry: CommandsRegistry = {};
	registerCommand(registry, "login", handlerLogin);
	registerCommand(registry, "register", handlerRegister);
	registerCommand(registry, "reset", handlerReset);
	registerCommand(registry, "users", handlerUsers);
	registerCommand(registry, "agg", handlerAgg);
	registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
	registerCommand(registry, "feeds", handlerFeeds);
	registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
	registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
	registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnfollow));
	registerCommand(registry, "browse", middlewareLoggedIn(handlerBrowse));

	const args = process.argv.slice(2);

	if (args.length < 1) {
		console.error("Unable to continue with no arguments.");
		process.exit(1);
	}

	const [cmdName, ...restArgs] = args;
	await runCommand(registry, cmdName, ...restArgs);
	process.exit(0);
}

main();
