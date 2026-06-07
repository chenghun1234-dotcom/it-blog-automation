*And some of those devs pushed to production. That's the scary part.*

---

There's this one story I keep thinking about. A junior dev — smart kid, decent portfolio — built a full-stack app for his freelance client. Next.js frontend, Node.js backend, everything wired together. Pushed to GitHub. Client's competitor found the repo three weeks later because it was public and the `.env` file was sitting right there. Database password. Stripe secret keys. Everything.

That project was not just a technical failure. It was a trust failure.

And here's the brutal thing: it wasn't a dumb mistake from an incompetent person. It was a *normal* mistake from a developer who never learned the actual mechanics of connecting these three tools. He knew how to code. He didn't know how they link.

Most developers are in that same boat right now in 2026, and none of them would admit it.

---

## Why This Stack Is So Dominant Right Now (And Why That Creates a Problem)

Next.js, Node.js, and Git. This is basically the default web dev stack for a huge chunk of the internet at this point. Next.js crossed 6 million weekly npm downloads in late 2024 and has held that range through 2025 into 2026. Node.js powers something like 6.3% of all websites directly and a much larger chunk indirectly through server-rendered frameworks. Git is used by 97.8% of professional developers according to the Stack Overflow Developer Survey 2025.

So you've got three massively dominant tools that every developer is expected to just... know. And because everyone assumes everyone else already knows this, nobody actually teaches how they interact.

The documentation covers them separately. Tutorials cover them in isolation. And then a developer has to wire them together in a real project and suddenly nothing makes sense.

This is that article. The one nobody wanted to write because it's admitting that the ecosystem has gaps nobody talks about.

---

## The Actual Mistakes (And How Bad They Get)

Let me go through them honestly. Not in order of how often they happen but in order of how badly they can hurt you.

---

### 1. Your .env File Is Probably Already on GitHub

I'm going to say this as directly as possible.

If you started a Next.js or Node.js project in the last three years and you didn't set up `.gitignore` before your first `git init` or `git add .`, there is a real chance your secrets are in your repository history. Even if you deleted the file later. Git doesn't work like a regular file system. It remembers.

GitHub's own security team reported that in 2024 alone, more than **12.8 million secrets** were exposed in public repositories. That includes API keys, database credentials, tokens, private keys. The number in 2025 was not smaller.

And the thing is, `.env` is listed in the default `.gitignore` that `create-next-app` generates. So why does this keep happening?

Because developers clone starter repos. They spin up custom setups. They copy folder structures from YouTube tutorials that are six months old and never show the `.gitignore` setup. They run `git add .` out of habit.

Here's what a proper `.gitignore` for a Next.js + Node.js project actually looks like:

```gitignore
# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Next.js
.next/
out/
build/
dist/

# Environment variables - THIS IS THE ONE
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# OS
.DS_Store
*.pem
Thumbs.db

# Debug
.npm
.eslintcache
```

And if you've already pushed secrets, here's the painful truth: deleting the file and pushing again does NOT remove it from history. You need to do this:

```bash
# Install git-filter-repo (better than BFG for 2025+)
pip install git-filter-repo

# Remove the .env file from entire history
git filter-repo --path .env --invert-paths

# Then force push (you will need to coordinate with your team)
git push origin --force --all
```

But honestly if the secret was already exposed for more than a few hours? Rotate the credentials. Assume they were taken. That's the real answer.

---

![The NEXT_PUBLIC Image](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/89ood0khpz13bc4ir481.png)
### 2. The NEXT_PUBLIC_ Trap Nobody Explains Properly

This one is subtle and it catches even experienced developers.

Next.js has two environments: server and client. Environment variables work differently in both. Variables that start with `NEXT_PUBLIC_` are bundled into the client-side JavaScript. Everything else stays on the server.

Sounds simple. But here's where people get it wrong.

```javascript
// This runs on the SERVER (API route, Server Component)
// Works fine
const dbPassword = process.env.DB_PASSWORD;

// This runs on the CLIENT (browser)
// process.env.DB_PASSWORD is undefined here
// because it's not prefixed with NEXT_PUBLIC_
const something = process.env.DB_PASSWORD; // undefined, no error, just silently broken
```

The terrifying part isn't the error. It's the silence. You won't get a crash in many cases. You'll just get `undefined` and then a cryptic failure somewhere downstream that takes you an hour to debug.

And the opposite mistake is even worse:

```javascript
// DON'T DO THIS
// This exposes your secret to every user's browser
NEXT_PUBLIC_DB_PASSWORD=supersecret123
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_live_...
```

Anything with `NEXT_PUBLIC_` is **visible to anyone who opens your site**. It gets embedded into the JavaScript bundle. DevTools. View Source. It's all there.

| Variable Type | Accessible In | Exposed to Browser? | Use For |
|---|---|---|---|
| `NEXT_PUBLIC_*` | Client + Server | YES | API base URLs, public keys, analytics IDs |
| Regular `ENV_VAR` | Server only | NO | DB passwords, secret keys, tokens |
| `process.env.NODE_ENV` | Both | NO (built-in) | Environment detection |

The rule is simple: if it's a secret, it never gets `NEXT_PUBLIC_`. If it has to be on the client, it better not be a secret.

---

![Ahmer Shah](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/28sbwh76o72cz20l8pcx.png)
### 3. CORS Is Not a Bug. It's You.

You've got Next.js running on port 3000. Your Node.js/Express backend is on port 3001. You make a fetch request. CORS error. You Google it. You find a Stack Overflow answer from 2019 that tells you to do this:

```javascript
// The lazy "fix" everyone copies
app.use(cors());
```

And it works locally. So you push to production.

And then in production it breaks again because the origin is different, or worse: it works but you've now allowed every single origin on the planet to make requests to your backend. Including people you don't want.

Here's what actually correct CORS configuration looks like for a Next.js + Node.js setup:

```javascript
// Express backend - cors.config.js
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-actual-domain.com',
  process.env.FRONTEND_URL // dynamic, set in .env
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'CORS policy blocked this origin: ' + origin;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // if you're using cookies/sessions
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

And honestly? If you're already using Next.js, ask yourself whether you need a separate Express server at all. Next.js API routes handle a huge amount of backend logic without this CORS mess.

---

### 4. You Don't Actually Know When to Use API Routes vs Express

This is the architectural confusion that costs teams weeks.

Next.js has built-in API routes (in `pages/api/` or `app/api/route.ts`). They run on Node.js. They're serverless by default when deployed to Vercel. They're fine for most things.

But a lot of developers either:

a) Build a whole Express.js server for things Next.js API routes would handle perfectly, creating unnecessary complexity and CORS problems.

b) Cram everything into Next.js API routes when they actually need persistent connections, WebSockets, heavy background jobs, or something Vercel doesn't support well.

Here's the honest comparison:

| Use Case | Next.js API Routes | Separate Node.js/Express |
|---|---|---|
| CRUD for your app's own data | Perfect | Overkill |
| Authentication (JWT, sessions) | Fine | Unnecessary complexity |
| Real-time features (WebSockets) | Not supported natively | Required |
| Heavy file processing | Cold starts are a problem | Better |
| Shared API between multiple frontends | Awkward | Right choice |
| Microservices architecture | Wrong tool | Right tool |
| Background jobs / cron | Limited (Vercel Cron has limits) | Better |
| Long-running processes | Hard timeout limits | Required |
| Database connection pooling at scale | Works but tricky | More control |

If you're building a standard web app with a database, auth, and CRUD — just use Next.js API routes. You don't need Express. You're adding complexity for no reason.

If you're building something that needs persistent connections, serves multiple clients, runs heavy background jobs, or lives on a VM you control — separate Node.js server makes sense.

Most developers I've seen choose the wrong one because they learned Express first and can't let it go.

---

### 5. Hardcoded URLs That Die in Production

This one is so common it's almost a rite of passage.

```javascript
// Works on your laptop, breaks everywhere else
const response = await fetch('http://localhost:3001/api/users');
```

This is hardcoded to localhost. When you deploy to Vercel or any server, `localhost:3001` means nothing. There's no machine called localhost in production. The request goes nowhere.

The fix isn't complicated. But you have to actually do it.

```javascript
// In .env.local (for development)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

// In .env.production
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

```javascript
// In your code
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const response = await fetch(`${API_BASE}/api/users`);
```

And if you're using Next.js API routes as your backend (same app), you don't even need an absolute URL:

```javascript
// This works in both dev and production when backend = same Next.js app
const response = await fetch('/api/users');
```

Relative URLs. Underrated. People overcomplicate this.

---

![Ahmer Shah](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nk0kao0nhnw7lxelq7xv.png)
### 6. Git Workflow for Full-Stack Projects Is Different and Nobody Talks About It

In a typical single-technology project, Git workflow is straightforward. Feature branch, PR, merge. But in a Next.js + Node.js project where the frontend and backend are sometimes in the same repo and sometimes in different repos, things get messy fast.

The two main patterns:

**Monorepo (same repo, both apps)**
```plaintext
my-project/
  ├── apps/
  │   ├── web/          (Next.js)
  │   └── api/          (Express.js)
  ├── packages/
  │   └── shared/       (shared types, utilities)
  └── package.json      (root, with workspaces)
```

**Polyrepo (separate repos)**
```plaintext
my-project-frontend/    (Next.js)
my-project-backend/     (Express.js)
```

The mistake most junior developers make is none of the above. They put everything in one flat folder and commit everything together, so a frontend change and a backend change always get tangled in the same commit. Makes code review messy. Makes rollbacks a nightmare.

And then there's branching. Here's what actually works for full-stack:

```bash
# Never commit directly to main
git checkout -b feature/user-authentication

# Commit frequently with meaningful messages
# Bad commit message:
git commit -m "fix stuff"

# Good commit message:
git commit -m "feat(auth): add JWT validation middleware to /api/auth/verify

- Validates token expiry
- Returns 401 on invalid token
- Logs failed attempts to console (temporary)"

# When done, push and open PR
git push origin feature/user-authentication
```

The conventional commits standard (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`) isn't just cosmetic. Tools like `semantic-release` and automatic changelog generators depend on it. In 2026 with AI code review tools integrated into GitHub, structured commits also give the AI better context about what changed.

---

### 7. The package-lock.json Civil War

Every team eventually has this fight.

One developer uses `npm install`. Another uses `yarn add`. A third one used `pnpm` because they watched a YouTube video. Now you have `package-lock.json`, `yarn.lock`, and `pnpm-lock.yaml` all in the same repo. Three different lockfiles, three different dependency resolution algorithms, and production might be running a completely different version of a package than what's on your laptop.

This is not a minor problem. Node.js's package ecosystem has had supply chain attacks where malicious code ended up in popular packages. Lockfiles are your defense mechanism. If everyone on the team is generating different lockfiles, the lockfile is meaningless.

Pick one package manager. Enforce it. Delete the others.

```json
// package.json - add this
{
  "engines": {
    "node": ">=22.0.0",
    "npm": ">=10.0.0"
  },
  "packageManager": "npm@10.8.0"
}
```

```bash
# .npmrc - to enforce no other package managers
engine-strict=true
```

And commit your `package-lock.json`. I know it's large. I know it creates merge conflicts. Commit it anyway. The moment you add it to `.gitignore` you've thrown away reproducible builds.

---

### 8. The .next Folder Is Not Source Code

This is a smaller mistake but it's one of those things that adds up.

`.next/` is Next.js's build output folder. It's generated fresh every time you run `next build` or `next dev`. It's specific to your machine, your Node.js version, and your build configuration.

Some developers commit it because they think it's needed. It's not. It should be in `.gitignore`.

| Folder | Commit to Git? | Why |
|---|---|---|
| `.next/` | No | Build output, machine-specific |
| `node_modules/` | Never | Installable from package.json |
| `out/` | Usually no | Static export output |
| `public/` | Yes | Static assets served by app |
| `src/` | Yes | Your actual source code |
| `.env.local` | Never | Local secrets |
| `next.config.js` | Yes | Configuration, not secrets |

Committing `node_modules` is the classic version of this mistake. Everyone learns it eventually. But `.next/` and `out/` catch more people than you'd think.

---

### 9. Nobody Configures next.config.js for Real Environments

The `next.config.js` file is where a lot of important production behavior lives and most tutorials just skip it entirely.

Here's a real example of things that break in production because they weren't configured:

```javascript
// next.config.js - what a real production config looks like

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tell Next.js where your external API lives (for rewrites/proxying)
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.BACKEND_URL}/api/:path*`,
      },
    ];
  },
  
  // Image domains (or you get 400 errors on external images)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-image-cdn.com',
        port: '',
        pathname: '/images/**',
      },
    ],
  },

  // Environment variables you want to expose through Next.js config
  // (alternative to NEXT_PUBLIC_ prefix for build-time values)
  env: {
    APP_VERSION: process.env.npm_package_version,
  },

  // Strict mode - catches more React issues in dev
  reactStrictMode: true,

  // Output mode for deployment
  // 'standalone' is what you want for Docker/VPS deployment
  output: process.env.NEXT_OUTPUT_MODE || undefined,
};

module.exports = nextConfig;
```

One that kills a lot of people: Next.js 15 (with App Router) handles rewrites differently from the Pages Router in some edge cases. If you're proxying requests to your Node.js backend through Next.js rewrites, test this in a staging environment that matches production. Vercel's serverless environment is not the same as `next start` on a VPS.

---

### 10. The Deployment Split Nobody Plans For

Here's the final one and it's the most expensive mistake in real projects.

You build your app locally. Next.js and Node.js both run on your machine, communicate fine, everything works. Then you go to deploy. And someone (probably you) makes a decision without thinking about it:

"I'll put the Next.js app on Vercel because it's free and easy."

So your Next.js app is on Vercel, which is serverless, auto-scaling, edge-deployed.

Your Node.js backend is on... a $5 DigitalOcean droplet. Or Railway. Or Render's free tier that spins down after 15 minutes of inactivity.

Now you have:
- Different deployment cadences
- Different environment variable management systems
- Cold start latency on one side but not the other
- CORS configuration that has to be updated every time the domain changes
- Two separate CI/CD pipelines to maintain
- Your Node.js backend hitting cold starts on the free tier, making your Vercel frontend look slow

Nobody planned this. It happened by accident. And now you're refactoring three months into the project.

The planning question you have to answer before writing a line of code:

| Scenario | Frontend | Backend | Notes |
|---|---|---|---|
| Hobby project, low traffic | Vercel | Vercel (API Routes only) | One deployment, no CORS |
| Medium app, budget matters | Vercel | Railway / Render | Plan for cold starts |
| Serious production app | Vercel | VPS (DigitalOcean, Hetzner) | Most control, more work |
| Full control / enterprise | VPS (Docker) | VPS (same or different) | You manage everything |
| Monorepo, full stack | Vercel | Vercel (both) | Works if serverless is fine |

---

## What the Actually Good Developers Do That Nobody Posts About

I've worked with and observed enough codebases at this point to notice the difference. Here's what separates developers who get this right:

They **set up the project structure before writing the first component**. `.gitignore`, environment variable schema, API base URL configuration — all before `git init`.

They **test environment variable loading in isolation**. Before wiring up any API call, they `console.log(process.env.WHATEVER)` in the actual runtime context where it'll be used. Server component? Client component? API route? They verify.

They **use a `.env.example` file** committed to the repo that shows every variable needed without the values. This is how you tell your team what to configure without leaking anything.

```bash
# .env.example (COMMIT THIS)
DATABASE_URL=postgresql://user:password@host:port/database
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Production values go in your deployment platform's environment settings
# NEVER commit .env.local or .env.production
```

They **treat Git history as documentation**. Not just for code review. When something breaks in production six months later, a good commit history lets you bisect the problem in minutes instead of hours.

```bash
# Binary search through commits to find when a bug was introduced
git bisect start
git bisect bad HEAD
git bisect good v1.0.0
# Git checks out the middle commit, you test it
# Then mark good or bad until you find the exact commit
git bisect good  # or git bisect bad
```

They **never debate whether to use the App Router or Pages Router in 2026**. The App Router is the default, it's stable, React Server Components are the future of this ecosystem. If you're starting a new project today and using Pages Router you're actively choosing to work with a deprecated pattern. That's a choice you're allowed to make but be honest that it's a choice.

---

## Spicy Take: The Real Problem Is Tutorials, Not Developers

Okay I'm going to say this and people are going to disagree with me.

The reason 90% of developers get this wrong isn't stupidity or laziness. It's the tutorial industry.

A YouTube tutorial on "Build a Full Stack App with Next.js and Node.js" has a 43-minute runtime. The first 38 minutes is features. The last 5 minutes is "and now deploy it to Vercel." The `.gitignore` setup takes 30 seconds and is either done off-camera or copied from a template without explanation. Environment variables are hardcoded for simplicity. CORS is fixed with `app.use(cors())` and nobody explains why.

Millions of developers learned from those tutorials. And then they went to build real things with those patterns and ran into real problems.

> "The documentation tells you what the tools do. It rarely tells you what happens when you misuse them in combination."

That gap between "I finished the tutorial" and "I can build real production software" is where most developers are stuck. And the combination of Next.js, Node.js, and Git is exactly where that gap shows up most violently.

---

## The One Thing That Would Fix 80% of These Problems

It's embarrassingly simple.

Start every project with this:

```bash
# 1. Initialize git FIRST, before anything else
git init my-project
cd my-project

# 2. Create .gitignore BEFORE adding any files
# Copy the one from the Node + Next.js section above

# 3. Create .env.example
touch .env.example
# Write out all the variables your app will need (empty values)

# 4. Create .env.local for your actual local values
# (This is already in .gitignore so it won't be committed)

# 5. THEN scaffold your Next.js app
npx create-next-app@latest . --typescript

# 6. First commit should be: gitignore + env.example + nothing else
git add .gitignore .env.example README.md
git commit -m "chore: project initialization with gitignore and env template"
```

That sequence. In that order. If every new developer starting a Next.js project followed those six steps in that order, the number of accidental secret exposures would drop dramatically.

The order matters because once you run `create-next-app`, you're tempted to immediately start building. And in that excitement, you forget to check what's actually being staged when you do `git add .`.

---

## Data Snapshot: Where This Stack Is in 2026

Some numbers that give context to why this matters at scale:

- Next.js remains the dominant React meta-framework by weekly npm downloads (consistently above 5.8M per week through Q1 2026)
- Node.js 22 LTS is the current recommended version as of early 2026; Node.js 24 released April 2025 is on a path to LTS in October 2026
- Git is used by 97.8% of developers in the Stack Overflow Developer Survey 2025 — effectively universal
- The State of JavaScript 2024 survey showed Next.js with 81% retention (developers who used it and would use it again) and rising adoption year-over-year
- GitHub's transparency report data for 2024 indicated that secrets scanning blocked millions of exposures before they became public — meaning the push-protection feature is catching the exact mistakes described in this article

The scale of adoption means these mistakes aren't happening to a few developers. They're happening tens of thousands of times a day, globally, by people across all experience levels.

---

## Common Questions That Don't Have Good Answers Online

**"Should I use Next.js API routes or a separate Express server for a startup?"**

If you're building a startup MVP, use Next.js API routes. You'll ship faster and you have one less deployment to manage. When you hit actual scaling problems, migrate. You won't hit those problems as early as you think.

**"Does it matter if node_modules gets committed once?"**

Yes. `node_modules` can be hundreds of megabytes. It bloats your repository permanently (remember, Git keeps history). And it creates reproducibility problems. Delete it from history using `git filter-repo` the same way you'd remove a secret.

**"What's the right Node.js version to use with Next.js 15?"**

Node.js 18 is the minimum for Next.js 15. Node.js 22 LTS is what you should be using in production as of early 2026. The compatibility table on the Next.js docs is up to date and should be your source of truth.

**"Why does my Next.js app work on Vercel but my environment variables are undefined?"**

Because you configured them in `.env.local` on your machine but forgot to add them to Vercel's environment variable settings in the dashboard. Vercel does not read your `.env.local`. You have to set every variable manually in the Vercel project settings. This trips up everyone once.

---

## Final Thought

The combination of Next.js, Node.js, and Git is genuinely powerful. The ecosystem in 2026 is mature enough that you can build serious production applications with it and compete with teams twice your size.

But "powerful" and "forgiving" are different things. This stack is not forgiving. It will let you push your `.env` to GitHub. It will silently give you `undefined` instead of your secret key. It will deploy with broken environment variables and give you no useful error message at 2am.

The developers who get this right aren't necessarily more talented. They've just been burned once and learned from it, or they were lucky enough to learn from someone who was burned.

Now you've read about it instead of having to live through it.

Use that.

---

## References and Sources

1. GitHub Security: "Detected and Prevented Secrets in 2024" — GitHub Blog, January 2025. https://github.blog/security/application-security/

2. Stack Overflow Developer Survey 2025 — Version Control Systems usage data. https://survey.stackoverflow.co/2025

3. State of JavaScript 2024 — Meta-Frameworks section, Next.js retention and usage figures. https://2024.stateofjs.com/

4. Next.js 15 Release Notes and Changelog — Vercel/Next.js GitHub repository. https://github.com/vercel/next.js/releases/tag/v15.0.0

5. Node.js Release Schedule — Node.js Foundation. https://nodejs.org/en/about/previous-releases

6. npm package download statistics for `next` — https://www.npmjs.com/package/next (weekly download trends, 2024-2026)

7. Next.js Documentation: Environment Variables — https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

8. Next.js Documentation: API Routes — https://nextjs.org/docs/pages/building-your-application/routing/api-routes

9. Conventional Commits Specification v1.0.0 — https://www.conventionalcommits.org/

10. git-filter-repo documentation — https://github.com/newren/git-filter-repo

11. OWASP Secrets Management Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html

12. Vercel Deployment Environment Variables Guide — https://vercel.com/docs/projects/environment-variables

---

*This article reflects my actual experience debugging these issues in real codebases. The mistakes described are patterns I've seen repeatedly, not edge cases. If something here contradicts what you've been doing, that's not an accident.*

---

*Find me across the web:*

- ✍️ **Medium:** [@syedahmershah](https://medium.com/@syedahmershah)
- 💬 **DEV.to:** [@syedahmershah](https://dev.to/syedahmershah)
- 🧠 **Hashnode:** [@syedahmershah](https://hashnode.com/@syedahmershah)
- 💻 **GitHub:** [@ahmershahdev](https://github.com/ahmershahdev)
- 🔗 **LinkedIn:** [Syed Ahmer Shah](https://www.linkedin.com/in/syedahmershah)
- 🌐 **Portfolio:** [ahmershah.dev](http://ahmershah.dev)

---
원문: [https://dev.to/syedahmershah/what-90-of-devs-screw-up-when-wiring-nextjs-nodejs-and-git-together-4ieh](https://dev.to/syedahmershah/what-90-of-devs-screw-up-when-wiring-nextjs-nodejs-and-git-together-4ieh)
수집일: 2026-06-07 02:09:41
