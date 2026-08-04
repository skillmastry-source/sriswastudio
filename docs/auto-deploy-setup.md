# One-time setup: automatic deploys to sriswastudio.com

After this setup, every change pushed to GitHub goes live on the website automatically.
You will never need to open the VPS terminal to deploy again.

You only need to do this ONCE. It takes about 5 minutes.

## Step 1 — Create a deploy key on the VPS

Log in to your Hostinger VPS terminal one last time (Hostinger panel → VPS → Browser terminal), then copy-paste these three commands one at a time:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N "" -C "github-actions-deploy"
```

```bash
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys
```

```bash
cat ~/.ssh/github_deploy
```

The last command prints your **private key**. It looks like this:

```
-----BEGIN OPENSSH PRIVATE KEY-----
(many lines of letters and numbers)
-----END OPENSSH PRIVATE KEY-----
```

Select and copy ALL of it, including the BEGIN and END lines. You'll paste it into GitHub in the next step.

## Step 2 — Add three secrets to GitHub

1. Open https://github.com/skillmastry-source/sriswastudio
2. Click **Settings** (top of the page) → **Secrets and variables** (left sidebar) → **Actions**
3. Click the green **New repository secret** button and add these three, one at a time:

| Name | Value |
|---|---|
| `HOST` | Your VPS IP address (shown in your Hostinger panel, e.g. `123.45.67.89`) |
| `USER` | The user you log in to the VPS with (usually `root`) |
| `SSH_PRIVATE_KEY` | The whole private key you copied in Step 1 |

Type the names EXACTLY as shown (all capitals).

## Step 3 — Test it

Push any change to the `main` branch (or in GitHub, edit any file and click "Commit changes").

Then open https://github.com/skillmastry-source/sriswastudio/actions — you'll see a run called **Deploy to VPS**:

- 🟡 Yellow dot = deploying now (takes a few minutes)
- ✅ Green check = the website is live with the new code
- ❌ Red X = something failed — click the run to read the error, nothing changed on the live site (it keeps running the old code)

That's it! From now on, every push to `main` deploys automatically.

## If a deploy fails

Click the failed run in the Actions tab and read the log — the deploy script prints a clear ❌ message explaining what went wrong. The live website keeps running the previous version until a deploy succeeds, so a failed deploy never breaks the site.
