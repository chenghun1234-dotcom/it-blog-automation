# I Built an Uptime Monitoring SaaS in a Weekend — Here's What I Learned

> 원본 출처: devto
> 발행 일시: 2026-03-27 15:28

## The Setup

I was paying $15/month for Uptime Robot.

I used maybe 30% of it. Most days I just needed to know: is my site up?

Friday night I thought: I could build this myself.

Saturday night I realized: I could build this in a weekend.

By Monday morning it was live.

Now I have 50 users and 3 paying customers. Here's what actually happened.

---

## Friday: The Problem Gets Real

You know when you pay for something you don't fully use, and you can't quite justify canceling it? That was me with Uptime Robot.

$15/month × 12 months = $180/year for monitoring I could describe as: "tell me if my site goes down."

I wasn't using:
- Advanced analytics
- The 17 different integration options
- Custom headers on requests
- Response time tracking
- Detailed historical reports

I just wanted: HTTP request every 30 seconds, alert when it fails.

So I sketched out what "simple" actually means:

**Core features:**
- Monitor HTTP endpoints
- 30-second check interval (fast enough for real alerts, slow enough to not hammer servers)
- Webhook alerts (route to whatever I want)
- Email alerts (backup option)
- Simple dashboard (show status and last check time)

**Tech stack:**
- Node.js + Express (I know it, builds fast)
- SQLite (no external database, backup = copy a file)
- DigitalOcean $5/month droplet (already had one)
- Stripe for payments (industry standard, boring is good)

**What I explicitly did NOT build:**
- Synthetic user journeys (too complex, different problem)
- Advanced dashboards (nobody cares)
- Integrations with every platform (webhooks handle 90% of use cases)
- TLS certificate monitoring (separate thing)
- Custom alert routing (webhooks are the answer)

This list of "what to NOT build" was more important than the "what to build" list.

---

## Saturday: The Core Engine

Saturday I built the monitoring engine:

```javascript
// Simplified version of the core check logic
async function performCheck(monitor) {
  const startTime = Date.now();

  try {
    const response = await fetch(monitor.url, {
      timeout: 10000,
      method: 'HEAD' // Use HEAD, not GET (faster)
    });

    const duration = Date.now() - startTime;

    if (response.status >= 200 && response.status < 300) {
      return {
        status: 'up',
        statusCode: response.status,
        duration: duration,
        timestamp: new Date()
      };
    } else {
      return {
        status: 'down',
        statusCode: response.status,
        reason: 'HTTP error',
        duration: duration,
        timestamp: new Date()
      };
    }
  } catch (error) {
    return {
      status: 'down',
      reason: error.message,
      duration: Date.now() - startTime,
      timestamp: new Date()
    };
  }
}
```

Most of the day was actually spent on edge cases:

**Problem 1: Flaky networks**
If a DNS lookup times out, is that a real alert or just a blip? I implemented retry logic:
- First timeout: wait 10 seconds, try again
- Second timeout: alert
- This reduced false positives from 10% to <1%

**Problem 2: SSL certificate issues**
A site can have an invalid cert but still serve content. Do we alert? I added logging for this:
- Invalid cert = alert with reason "SSL cert issue"
- Response still comes through = not an outage, but a problem

**Problem 3: Hanging connections**
Some servers hang indefinitely on connect. I added timeout logic:
- 10-second timeout on each check
- If it hangs, mark as down and move on

**Problem 4: Load spreading**
If I check 1000 sites every 30 seconds, that's 33 requests per second. Spread over 30 seconds, that's 1 req/sec. But concurrently? I learned about connection pooling fast.

Solution: use HTTP/2 keep-alive, limit concurrent connections, queue checks.

By 11pm Saturday night, the engine worked. I could add a URL and get alerted when it went down.

---

## Sunday: The Boring Stuff

Sunday was database schema, UI, and Stripe integration.

**Database (SQLite):**

```sql
CREATE TABLE monitors (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255),
  url VARCHAR(2048),
  check_interval INTEGER DEFAULT 30,
  alert_method VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE checks (
  id UUID PRIMARY KEY,
  monitor_id UUID NOT NULL,
  status VARCHAR(10),
  status_code INTEGER,
  response_time INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP,
  FOREIGN KEY (monitor_id) REFERENCES monitors(id)
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  monitor_id UUID NOT NULL,
  previous_status VARCHAR(10),
  new_status VARCHAR(10),
  triggered_at TIMESTAMP,
  delivered_at TIMESTAMP
);
```

Simple schema. No normalization beyond basic stuff. Easy to query.

**UI:**

The dashboard was ruthlessly simple:
- List of monitors
- Status for each (up or down)
- Last check time
- Uptime percentage (last 24 hours)
- Button to add a monitor

No graph. No drill-down. No customization.

People hated the simplicity at first. Then they realized they could find what they needed in 3 seconds instead of 3 minutes.

**Stripe Integration:**

Took longer than expected. Their API is comprehensive but has a learning curve.

Key parts:
- Webhook handling for payment events (customer.subscription.created, charge.succeeded, etc)
- Free tier switching logic (auto-downgrade if payment fails)
- Webhook validation (verify it came from Stripe, not someone faking it)

By 8pm Sunday: everything worked.

---

## Monday: Launch Day

Deployed to DigitalOcean. Set up HTTPS (Let's Encrypt, free). Wrote landing page copy.

Launched on:
1. **IndieHackers** (~20 signups)
2. **Dev.to** (~15 signups)
3. **Reddit** comments in r/webdev, r/SaaS (~8 signups)
4. **Twitter** thread (~5 signups)

Total: ~50 signups in 24 hours.

---

## What's Working

**1. Ruthless scope**

Every feature request got filtered through: "Is this essential?"

90% were "no."

The 10% that were "yes" were: reliability, simplicity, price.

**2. Honest pricing**

$12/month because that's what I'd pay. Not:
- $12.99 (avoiding the number 9)
- $19/month (higher price = more features in people's heads)
- Free trial then paywall

Just: $0 for 10 monitors, $12/month for 25 monitors.

**3. Free tier that works**

10 monitors forever. No credit card. No time limit. No restrictions that disappear.

This converts because people actually use it, find it useful, then pay.

**4. Personal support**

Responded personally to every signup email, every question. Takes time but builds trust.

People don't expect founders to read their emails. They're shocked when you do.

**5. Building in public**

Posted about building it on Twitter as it happened. People followed along. Built community before launch.

---

## What's Not Working

**1. Discovery is brutal**

Getting 50 users is easy. Getting 500 is hard. Getting 5000 is really hard.

I don't have a marketing engine yet. Just me posting on niche communities.

**2. Feature requests pile up fast**

Everyone wants Slack integration. Some want SMS. Some want custom headers.

I can build maybe 1 feature per week. Feedback comes in at 3 per day.

This is a good problem (means people use it) but also stressful.

**3. Support takes time**

Even simple product = people have questions.

"How do I monitor FTP?" (Can't, not HTTP)
"Can I check every 5 seconds?" (No, I chose 30s for good reasons)
"Will you integrate with Datadog?" (Not a priority)

Each question is an email I read and respond to.

**4. Pricing might be wrong**

$36/month revenue, $8/month costs = technically profitable.

But is $12/month the right price? Should it be $19? $5?

I don't know yet. I'll know when growth slows.

---

## What I Learned

### Technical

**1. Monitoring is harder than it looks**

HTTP checks seem simple: send request, check response. The edges are where complexity hides.

Timeouts, retries, false positives, concurrency limits. Hours spent on these.

**2. SQLite is underrated**

I was worried about scaling. Realized: 1000 monitors with 30-second checks = 2000 inserts/minute = no real load.

SQLite handles this easily on a $5 box.

Lesson: don't over-engineer for future scale you don't have.

**3. Keep infrastructure simple**

Single DigitalOcean droplet. Single database. No message queue (yet). No microservices.

If something breaks, I can SSH in and see exactly what's wrong.

Complexity is the enemy of reliability.

### Business

**1. Building > Planning**

I could have spent 3 months planning. Instead I built for 20 hours and learned more than I would in 3 months of planning.

Users tell you what matters. Plans don't.

**2. Bootstrapped is freedom**

No investor pressure to grow fast. No need for a VC exit.

If this gets to $5k/month, I'm happy. If it stays at $36/month, I learned a ton.

This takes pressure off and lets me make good long-term decisions.

**3. Support is a feature**

Replying to every email personally is slow and doesn't scale.

But it's the moat right now. People feel heard. That's rare with SaaS.

**4. Honest language sells**

"Simple uptime monitoring" beats "revolutionary monitoring platform"

"$0 free or $12/month" beats "free trial, then $29/month"

People respect transparency.

### Marketing

**1. Content >> Ads**

Every signup came from content I made (Twitter thread, Dev.to, Reddit comments, IndieHackers post).

Zero dollar spent on ads. Zero results from ads.

**2. Being early is useful**

Launching on IndieHackers while bootstrapping was interesting to people.

Launching on PH/HN soon will be even more interesting (because it's real users, real revenue).

**3. Niche communities > broad reach**

50 signups from targeted communities (r/webdev, r/SaaS) is worth more than 500 from random places.

These communities have actual standards and actual users.

---

## Numbers (Full Transparency)

**Launch week:**
- 50 signups
- 5 paid customers (3 stuck around)
- $36 MRR
- 400 site visitors
- 0 dollar spent on marketing

**Infrastructure:**
- $5/month: DigitalOcean droplet (1GB, 1 CPU)
- $10/year: domain
- ~$0.70/month: Stripe processing fees
- Total: $8/month

**Time invested:**
- 20 hours: building
- 10 hours: thinking about it first
- 5 hours: writing copy and posting
- Total: 35 hours

**Current (1 week later):**
- 50 total signups
- 3 active paid customers
- 120+ sites being monitored
- 99.8% uptime
- $36 MRR

---

## What's Next

**This week:**
- Talk to paying customers about what matters
- Fix bugs as they appear
- Write better documentation
- Respond to all feedback

**Next month:**
- Slack integration (everyone asks for it)
- Better reporting (time-based uptime stats)
- API access (for advanced users)

**In 3 months:**
- Evaluate if this is a real business or a hobby
- Decide how much time to invest

**In 1 year:**
- Either: $5k+ MRR (make it bigger)
- Or: Keep as small profitable product
- Or: Realize it doesn't work and move on

All three are acceptable outcomes.

---

## Takeaway

You don't need months of planning to build and launch something real.

You need:
1. Problem you actually have
2. Scope that fits in a weekend
3. Willingness to ship rough and learn from users

I could have:
- Spent 3 months perfecting the UI
- Built 20 features nobody needs
- Over-engineered the infrastructure
- Procrastinated while "planning"

Instead I shipped in 3 days.

That's the win.

The specific product (uptime monitoring) is less important than the fact that I went from idea to production with real users in 72 hours.

---

## Try It

If you're monitoring websites and tired of your current setup, check out PingSentry: https://pingsentry.app

Free tier is actually useful (10 monitors, forever, no credit card).

Paid tier is $12/month (25 monitors) or $39/month (unlimited) if you want more.

---

## Questions I Know You'll Ask

**Q: Will you keep building this?**

A: If there's enough demand, yes. I'm bootstrapped, so it's long-term thinking. If I get to 100-200 paying customers, it becomes a real time investment.

**Q: Why not open source it?**

A: Might do this eventually. For now, I want to own the customer relationship and understand the business.

**Q: How long until you have 10 employees?**

A: If it gets there, great. But I'm optimizing for sustainability, not growth. A profitable 1-person business is better than a failing 10-person team.

**Q: Isn't this saturated?**

A: Yes. Uptime monitoring is commodity. But there's room for the simple, boring alternative to expensive platforms. That's my bet.

**Q: What if Uptime Robot launches a $5/month tier?**

A: I'm probably in trouble. But they're not optimizing for simple + cheap. So I have time.

---

## Thanks

To everyone who signed up, tried it, and sent feedback. You made this real.

To the dev community (Reddit, HN, Twitter, Dev.to) for amplifying my posts.

To the bootstrapped SaaS community for showing that this path exists.

If you're building something: ship it. Stop planning. Start shipping.

That's it. That's the advice.

---

## Connect

- **Website:** https://pingsentry.app
- **Twitter:** [@TheZilisch](https://twitter.com/TheZilisch)
- **Email:** feedback@pingsentry.app
