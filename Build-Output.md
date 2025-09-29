2025-09-29T17:41:24.077724Z	Cloning repository...
2025-09-29T17:41:25.486586Z	From https://github.com/dj-pearson/gym-unity-suite
2025-09-29T17:41:25.487114Z	 * branch            f1e2ed7412b3c66c6e772221b0286306f0b101ab -> FETCH_HEAD
2025-09-29T17:41:25.487243Z	
2025-09-29T17:41:25.600759Z	HEAD is now at f1e2ed7 Add Scheduling and New York Gym Software pages with structured data, features, testimonials, and FAQs
2025-09-29T17:41:25.601231Z	
2025-09-29T17:41:25.684235Z	
2025-09-29T17:41:25.684706Z	Using v2 root directory strategy
2025-09-29T17:41:25.708959Z	Success: Finished cloning repository files
2025-09-29T17:41:27.501664Z	Checking for configuration in a Wrangler configuration file (BETA)
2025-09-29T17:41:27.502395Z	
2025-09-29T17:41:27.503716Z	Found wrangler.toml file. Reading build configuration...
2025-09-29T17:41:27.509699Z	pages_build_output_dir: dist
2025-09-29T17:41:27.509976Z	Build environment variables: (none found)
2025-09-29T17:41:28.626897Z	Successfully read wrangler.toml file.
2025-09-29T17:41:28.70364Z	Detected the following tools from environment: nodejs@18.20.8, npm@10.9.2
2025-09-29T17:41:28.704183Z	Installing nodejs 18.20.8
2025-09-29T17:41:29.766986Z	Trying to update node-build... ok
2025-09-29T17:41:29.868113Z	To follow progress, use 'tail -f /tmp/node-build.20250929174129.494.log' or pass --verbose
2025-09-29T17:41:29.973779Z	Downloading node-v18.20.8-linux-x64.tar.gz...
2025-09-29T17:41:30.23769Z	-> https://nodejs.org/dist/v18.20.8/node-v18.20.8-linux-x64.tar.gz
2025-09-29T17:41:31.853461Z	
2025-09-29T17:41:31.853758Z	WARNING: node-v18.20.8-linux-x64 is in LTS Maintenance mode and nearing its end of life.
2025-09-29T17:41:31.853907Z	It only receives *critical* security updates, *critical* bug fixes and documentation updates.
2025-09-29T17:41:31.85403Z	
2025-09-29T17:41:31.854176Z	Installing node-v18.20.8-linux-x64...
2025-09-29T17:41:32.243666Z	Installed node-v18.20.8-linux-x64 to /opt/buildhome/.asdf/installs/nodejs/18.20.8
2025-09-29T17:41:32.243987Z	
2025-09-29T17:41:33.277601Z	Installing project dependencies: npm clean-install --progress=false
2025-09-29T17:41:42.14947Z	
2025-09-29T17:41:42.149829Z	added 449 packages in 9s
2025-09-29T17:41:42.168338Z	Executing user command: npm run build
2025-09-29T17:41:42.587536Z	
2025-09-29T17:41:42.587788Z	> vite_react_shadcn_ts@0.0.0 build
2025-09-29T17:41:42.588314Z	> vite build
2025-09-29T17:41:42.58844Z	
2025-09-29T17:41:42.878529Z	[36mvite v5.4.19 [32mbuilding for production...[36m[39m
2025-09-29T17:41:42.938189Z	[32m✓[39m 0 modules transformed.
2025-09-29T17:41:42.946132Z	[31mx[39m Build failed in 40ms
2025-09-29T17:41:42.946615Z	[31merror during build:
2025-09-29T17:41:42.946821Z	[31m[vite:build-html] Unable to parse HTML; parse5 error code unexpected-character-in-unquoted-attribute-value
2025-09-29T17:41:42.946958Z	 at /opt/buildhome/repo/index.html:50:17
2025-09-29T17:41:42.947078Z	48 |      <meta name="mobile-web-app-capable" content="yes" />
2025-09-29T17:41:42.947242Z	49 |      <meta name="theme-color" content="#6366f1" />
2025-09-29T17:41:42.947348Z	50 |      <meta name=\"msapplication-TileColor\" content=\"#6366f1\" />
2025-09-29T17:41:42.947475Z	   |                  ^
2025-09-29T17:41:42.947596Z	51 |      
2025-09-29T17:41:42.947751Z	52 |      <!-- Structured Data for Organization & Software Application -->\n    <script type=\"application/ld+json\">\n    {\n      \"@context\": \"https://schema.org\",\n      \"@graph\": [\n        {\n          \"@type\": \"Organization\",\n          \"@id\": \"https://repclub.app/#organization\",\n          \"name\": \"Rep Club\",\n          \"alternateName\": \"Rep Club Fitness Management\",\n          \"url\": \"https://repclub.app/\",\n          \"logo\": {\n            \"@type\": \"ImageObject\",\n            \"@id\": \"https://repclub.app/#logo\",\n            \"url\": \"https://repclub.app/assets/logo.png\",\n            \"contentUrl\": \"https://repclub.app/assets/logo.png\",\n            \"width\": 512,\n            \"height\": 512,\n            \"caption\": \"Rep Club Logo\"\n          },\n          \"sameAs\": [\n            \"https://twitter.com/RepClubFitness\",\n            \"https://linkedin.com/company/repclub\",\n            \"https://facebook.com/RepClubFitness\"\n          ],\n          \"contactPoint\": {\n            \"@type\": \"ContactPoint\",\n            \"telephone\": \"+1-800-REP-CLUB\",\n            \"contactType\": \"customer service\",\n            \"areaServed\": \"US\",\n            \"availableLanguage\": \"English\"\n          }\n        },\n        {\n          \"@type\": \"SoftwareApplication\",\n          \"@id\": \"https://repclub.app/#software\",\n          \"name\": \"Rep Club - Gym Management Software\",\n          \"description\": \"All-in-one gym management software for fitness studios, gyms, and boutique fitness centers. Complete member management, class scheduling, billing automation, and analytics.\",\n          \"url\": \"https://repclub.app/\",\n          \"applicationCategory\": \"BusinessApplication\",\n          \"applicationSubCategory\": \"Fitness Management Software\",\n          \"operatingSystem\": \"Web Browser, iOS, Android\",\n          \"softwareVersion\": \"2.0\",\n          \"releaseNotes\": \"Enhanced AI features, improved mobile experience, advanced analytics\",\n          \"screenshot\": \"https://repclub.app/assets/dashboard-screenshot.jpg\",\n          \"featureList\": [\n            \"Member Management System\",\n            \"Class Scheduling & Booking\",\n            \"Automated Billing & Payments\", \n            \"Real-time Analytics & Reporting\",\n            \"Mobile Check-in System\",\n            \"Staff Management & Payroll\",\n            \"Equipment Management\",\n            \"Marketing Automation\",\n            \"Multi-location Support\"\n          ],\n          \"offers\": [\n            {\n              \"@type\": \"Offer\",\n              \"name\": \"Studio Plan\",\n              \"price\": \"149.00\",\n              \"priceCurrency\": \"USD\",\n              \"priceValidUntil\": \"2025-12-31\",\n              \"availability\": \"https://schema.org/InStock\",\n              \"validFrom\": \"2024-11-01\"\n            },\n            {\n              \"@type\": \"Offer\",\n              \"name\": \"Professional Plan\",\n              \"price\": \"349.00\",\n              \"priceCurrency\": \"USD\",\n              \"priceValidUntil\": \"2025-12-31\",\n              \"availability\": \"https://schema.org/InStock\",\n              \"validFrom\": \"2024-11-01\"\n            },\n            {\n              \"@type\": \"Offer\",\n              \"name\": \"Enterprise Plan\",\n              \"price\": \"649.00\",\n              \"priceCurrency\": \"USD\",\n              \"priceValidUntil\": \"2025-12-31\",\n              \"availability\": \"https://schema.org/InStock\",\n              \"validFrom\": \"2024-11-01\"\n            }\n          ],\n          \"provider\": {\n            \"@id\": \"https://repclub.app/#organization\"\n          },\n          \"publisher\": {\n            \"@id\": \"https://repclub.app/#organization\"\n          },\n          \"aggregateRating\": {\n            \"@type\": \"AggregateRating\",\n            \"ratingValue\": \"4.9\",\n            \"reviewCount\": \"247\",\n            \"bestRating\": \"5\",\n            \"worstRating\": \"1\"\n          }\n        },\n        {\n          \"@type\": \"WebSite\",\n          \"@id\": \"https://repclub.app/#website\",\n          \"url\": \"https://repclub.app/\",\n          \"name\": \"Rep Club - Gym Management Software\",\n          \"description\": \"#1 gym management software for fitness studios and gyms. Complete business management solution.\",\n          \"publisher\": {\n            \"@id\": \"https://repclub.app/#organization\"\n          },\n          \"potentialAction\": {\n            \"@type\": \"SearchAction\",\n            \"target\": \"https://repclub.app/search?q={search_term_string}\",\n            \"query-input\": \"required name=search_term_string\"\n          }\n        }\n      ]\n    }\n    </script>\n  </head>[31m
2025-09-29T17:41:42.947966Z	file: [36m/opt/buildhome/repo/index.html[31m
2025-09-29T17:41:42.948053Z	    at handleParseError (file:///opt/buildhome/repo/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:35172:9)
2025-09-29T17:41:42.948158Z	    at Parser.onParseError (file:///opt/buildhome/repo/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:35097:7)
2025-09-29T17:41:42.948266Z	    at Tokenizer._err (file:///opt/buildhome/repo/node_modules/vite/dist/node/chunks/dep-D-7KCb9p.js:1155:89)
2025-09-29T17:41:42.948351Z	    at Tokenizer._stateAttributeValueUnquoted (file:///opt/buildhome/repo/node_modules/vite/dist/node/chunks/dep-D-7KCb9p.js:2717:22)
2025-09-29T17:41:42.948436Z	    at Tokenizer._callState (file:///opt/buildhome/repo/node_modules/vite/dist/node/chunks/dep-D-7KCb9p.js:1662:22)
2025-09-29T17:41:42.948495Z	    at Tokenizer._runParsingLoop (file:///opt/buildhome/repo/node_modules/vite/dist/node/chunks/dep-D-7KCb9p.js:1179:22)
2025-09-29T17:41:42.948561Z	    at Tokenizer.write (file:///opt/buildhome/repo/node_modules/vite/dist/node/chunks/dep-D-7KCb9p.js:1204:14)
2025-09-29T17:41:42.948677Z	    at Parser.parse (file:///opt/buildhome/repo/node_modules/vite/dist/node/chunks/dep-D-7KCb9p.js:4886:26)
2025-09-29T17:41:42.948781Z	    at parse (file:///opt/buildhome/repo/node_modules/vite/dist/node/chunks/dep-D-7KCb9p.js:7957:19)
2025-09-29T17:41:42.948881Z	    at traverseHtml (file:///opt/buildhome/repo/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:35092:15)[39m
2025-09-29T17:41:42.963428Z	Failed: Error while executing user command. Exited with error code: 1
2025-09-29T17:41:42.973035Z	Failed: build command exited with code: 1
2025-09-29T17:41:44.18248Z	Failed: error occurred while running build command