# PhishGuard 🛡️

Simple, effective phishing detection using AI and human-readable rules.

## What is PhishGuard?

PhishGuard protects users from phishing websites through:
- **Browser Extension** - Real-time protection while browsing
- **Web Application** - Educational resources and advanced scanning
- **Machine Learning** - Simple, explainable detection rules

## Project Structure

```
PhishGuard/
├── apps/
│   ├── extension/          # Browser extension
│   └── web/               # Next.js web application
├── packages/
│   ├── ml/                # Phishing detection logic
│   └── utils/             # Shared utilities
├── package.json           # Root package configuration
├── pnpm-workspace.yaml    # Workspace configuration
└── turbo.json            # Build system configuration
```

## Getting Started

### Prerequisites
- Node.js 18 or higher
- pnpm package manager

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd PhishGuard
   pnpm install
   ```

2. **Build all packages:**
   ```bash
   pnpm build
   ```

3. **Start development:**
   ```bash
   pnpm dev
   ```

## Components

### 🧠 ML Package (`packages/ml`)
Simple phishing detection using human-readable rules:
- URL length analysis
- Suspicious keyword detection
- HTTPS verification
- Domain structure analysis

### 🔧 Utils Package (`packages/utils`)
Shared utilities for URL parsing, security checks, and logging.

### 🌐 Web App (`apps/web`)
Next.js application providing:
- Educational content about phishing
- Advanced URL scanning interface
- Statistics and reporting

### 🔌 Browser Extension (`apps/extension`)
Chrome/Edge extension offering:
- Real-time protection
- Warning badges and banners
- Manual page scanning

## Available Scripts

- `pnpm dev` - Start development servers
- `pnpm build` - Build all packages
- `pnpm lint` - Run linting
- `pnpm test` - Run tests
- `pnpm clean` - Remove all node_modules
- `pnpm reset` - Clean and reinstall dependencies
- `pnpm build:extension` - Build only the browser extension
- `pnpm start:web` - Start only the web application

## Extension Installation

1. Build the extension: `pnpm build:extension`
2. Open Chrome/Edge and go to extensions page
3. Enable "Developer mode"
4. Click "Load unpacked" and select `apps/extension/dist`

## How Detection Works

PhishGuard uses simple, explainable rules to detect phishing:

1. **URL Analysis**
   - Length (phishing URLs are often very long)
   - IP addresses (legitimate sites use domain names)
   - Too many subdomains

2. **Content Analysis**
   - Suspicious keywords ("urgent", "verify", "suspended")
   - Missing HTTPS on login forms
   - Domain name spoofing

3. **Risk Scoring**
   - Each suspicious indicator adds to risk score
   - Clear thresholds for low/medium/high risk
   - Human-readable explanations for all warnings

## Philosophy

**Simple > Complex**
- Human-readable code over black-box AI
- Clear explanations over mysterious scores
- Basic protection that works over complex features that don't

**Privacy-First**
- No data collection
- No cloud dependencies
- Everything runs locally

**Educational**
- Users understand why sites are flagged
- Clear warnings with actionable advice
- Educational content about phishing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions or issues:
- Create an issue on GitHub
- Check the documentation in each package
- Review the code - it's designed to be readable!

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```


