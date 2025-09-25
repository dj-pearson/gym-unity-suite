2025-09-25T20:37:53.269204Z	Cloning repository...
2025-09-25T20:37:54.707316Z	From https://github.com/dj-pearson/gym-unity-suite
2025-09-25T20:37:54.707828Z	 * branch            75ee4782b927b5a510c03b3831037bd0a831f7d9 -> FETCH_HEAD
2025-09-25T20:37:54.707955Z	
2025-09-25T20:37:54.821172Z	HEAD is now at 75ee478 Remove unused build commands and environment configurations from wrangler.toml
2025-09-25T20:37:54.821698Z	
2025-09-25T20:37:54.898923Z	
2025-09-25T20:37:54.899634Z	Using v2 root directory strategy
2025-09-25T20:37:54.921653Z	Success: Finished cloning repository files
2025-09-25T20:37:56.733126Z	Checking for configuration in a Wrangler configuration file (BETA)
2025-09-25T20:37:56.734176Z	
2025-09-25T20:37:56.735439Z	Found wrangler.toml file. Reading build configuration...
2025-09-25T20:37:56.7419Z	pages_build_output_dir: dist
2025-09-25T20:37:56.742054Z	Build environment variables: (none found)
2025-09-25T20:37:57.850171Z	Successfully read wrangler.toml file.
2025-09-25T20:37:57.916294Z	Found a .tool-versions file in user-specified root directory. Installing dependencies.
2025-09-25T20:37:58.444345Z	bun 1.2.15 is already installed
2025-09-25T20:37:58.544252Z	dart-sass-embedded 1.62.1 is already installed
2025-09-25T20:37:58.644326Z	golang 1.24.3 is already installed
2025-09-25T20:37:58.744531Z	hugo extended_0.147.7 is already installed
2025-09-25T20:37:59.83371Z	Trying to update node-build... ok
2025-09-25T20:37:59.932365Z	To follow progress, use 'tail -f /tmp/node-build.20250925203759.741.log' or pass --verbose
2025-09-25T20:38:00.033577Z	Downloading node-v18.20.8-linux-x64.tar.gz...
2025-09-25T20:38:00.289076Z	-> https://nodejs.org/dist/v18.20.8/node-v18.20.8-linux-x64.tar.gz
2025-09-25T20:38:02.114329Z	
2025-09-25T20:38:02.114677Z	WARNING: node-v18.20.8-linux-x64 is in LTS Maintenance mode and nearing its end of life.
2025-09-25T20:38:02.114837Z	It only receives *critical* security updates, *critical* bug fixes and documentation updates.
2025-09-25T20:38:02.11501Z	
2025-09-25T20:38:02.115146Z	Installing node-v18.20.8-linux-x64...
2025-09-25T20:38:02.492025Z	Installed node-v18.20.8-linux-x64 to /opt/buildhome/.asdf/installs/nodejs/18.20.8
2025-09-25T20:38:02.492333Z	
2025-09-25T20:38:03.269382Z	python 3.13.3 is already installed
2025-09-25T20:38:03.293082Z	python 2.7.18 is already installed
2025-09-25T20:38:03.401029Z	ruby 3.4.4 is already installed
2025-09-25T20:38:03.415177Z	Detected the following tools from environment: nodejs@18.20.8, npm@10.9.2, bun@1.2.15
2025-09-25T20:38:03.415424Z	Installing nodejs 18.20.8
2025-09-25T20:38:03.47635Z	nodejs 18.20.8 is already installed
2025-09-25T20:38:03.804445Z	Installing project dependencies: bun install --frozen-lockfile
2025-09-25T20:38:04.018832Z	[0.06ms] ".env"
2025-09-25T20:38:04.020253Z	bun install v1.2.15 (df017990)
2025-09-25T20:38:04.024132Z	Resolving dependencies
2025-09-25T20:38:04.473062Z	Resolved, downloaded and extracted [298]
2025-09-25T20:38:04.474855Z	error: lockfile had changes, but lockfile is frozen
2025-09-25T20:38:04.47503Z	note: try re-running without --frozen-lockfile and commit the updated lockfile
2025-09-25T20:38:04.486035Z	Error: Exit with error code: 1
2025-09-25T20:38:04.486516Z	    at ChildProcess.<anonymous> (/snapshot/dist/run-build.js)
2025-09-25T20:38:04.486795Z	    at Object.onceWrapper (node:events:652:26)
2025-09-25T20:38:04.486917Z	    at ChildProcess.emit (node:events:537:28)
2025-09-25T20:38:04.487023Z	    at ChildProcess._handle.onexit (node:internal/child_process:291:12)
2025-09-25T20:38:04.495577Z	Failed: build command exited with code: 1
2025-09-25T20:38:07.04274Z	Failed: error occurred while running build command