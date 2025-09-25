2025-09-25T20:32:58.532849Z	Cloning repository...
2025-09-25T20:33:00.008658Z	From https://github.com/dj-pearson/gym-unity-suite
2025-09-25T20:33:00.009188Z	 * branch            4b7d5e1a897e4baea0d89469c877410b0b49bed9 -> FETCH_HEAD
2025-09-25T20:33:00.009327Z	
2025-09-25T20:33:00.123455Z	HEAD is now at 4b7d5e1 Update package-lock.json and add build:pages script to package.json
2025-09-25T20:33:00.124024Z	
2025-09-25T20:33:00.205596Z	
2025-09-25T20:33:00.206168Z	Using v2 root directory strategy
2025-09-25T20:33:00.229118Z	Success: Finished cloning repository files
2025-09-25T20:33:02.024003Z	Checking for configuration in a Wrangler configuration file (BETA)
2025-09-25T20:33:02.025043Z	
2025-09-25T20:33:02.025792Z	Found wrangler.toml file. Reading build configuration...
2025-09-25T20:33:03.140283Z	A wrangler.toml file was found but it does not appear to be valid. Did you mean to use wrangler.toml to configure Pages? If so, then make sure the file is valid and contains the `pages_build_output_dir` property. Skipping file and continuing.
2025-09-25T20:33:03.217771Z	Detected the following tools from environment: nodejs@18.20.8, npm@10.9.2, bun@1.2.15
2025-09-25T20:33:03.218602Z	Installing nodejs 18.20.8
2025-09-25T20:33:04.288655Z	Trying to update node-build... ok
2025-09-25T20:33:04.382917Z	To follow progress, use 'tail -f /tmp/node-build.20250925203304.494.log' or pass --verbose
2025-09-25T20:33:04.479691Z	Downloading node-v18.20.8-linux-x64.tar.gz...
2025-09-25T20:33:04.704864Z	-> https://nodejs.org/dist/v18.20.8/node-v18.20.8-linux-x64.tar.gz
2025-09-25T20:33:06.381825Z	
2025-09-25T20:33:06.382094Z	WARNING: node-v18.20.8-linux-x64 is in LTS Maintenance mode and nearing its end of life.
2025-09-25T20:33:06.382262Z	It only receives *critical* security updates, *critical* bug fixes and documentation updates.
2025-09-25T20:33:06.382381Z	
2025-09-25T20:33:06.382525Z	Installing node-v18.20.8-linux-x64...
2025-09-25T20:33:06.772848Z	Installed node-v18.20.8-linux-x64 to /opt/buildhome/.asdf/installs/nodejs/18.20.8
2025-09-25T20:33:06.773116Z	
2025-09-25T20:33:07.756981Z	Installing project dependencies: bun install --frozen-lockfile
2025-09-25T20:33:07.969924Z	[0.06ms] ".env"
2025-09-25T20:33:07.971352Z	bun install v1.2.15 (df017990)
2025-09-25T20:33:08.012332Z	Resolving dependencies
2025-09-25T20:33:08.599601Z	Resolved, downloaded and extracted [298]
2025-09-25T20:33:08.601554Z	error: lockfile had changes, but lockfile is frozen
2025-09-25T20:33:08.601718Z	note: try re-running without --frozen-lockfile and commit the updated lockfile
2025-09-25T20:33:08.611393Z	Error: Exit with error code: 1
2025-09-25T20:33:08.611598Z	    at ChildProcess.<anonymous> (/snapshot/dist/run-build.js)
2025-09-25T20:33:08.611705Z	    at Object.onceWrapper (node:events:652:26)
2025-09-25T20:33:08.611878Z	    at ChildProcess.emit (node:events:537:28)
2025-09-25T20:33:08.611976Z	    at ChildProcess._handle.onexit (node:internal/child_process:291:12)
2025-09-25T20:33:08.62217Z	Failed: build command exited with code: 1
2025-09-25T20:33:10.573257Z	Failed: error occurred while running build command