# VeloxAPI GitHub Pages

This directory contains the GitHub Pages website for VeloxAPI.

## 🌐 Live Site

Once published, the site will be available at: `https://karandaid.github.io/velox_api/`

## 📁 Files

- `index.html` - Main landing page showcasing VeloxAPI features
- `404.html` - Custom 404 error page

## 🚀 Publishing to GitHub Pages

### Method 1: Using GitHub Settings (Recommended)

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Add GitHub Pages site"
   git push origin main
   ```

2. Go to your repository on GitHub
3. Click **Settings** → **Pages**
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/website`
5. Click **Save**
6. Your site will be live at `https://karandaid.github.io/velox_api/` in a few minutes

### Method 2: Using gh-pages Branch

Alternatively, you can deploy from a separate `gh-pages` branch:

```bash
# Create and checkout gh-pages branch
git checkout --orphan gh-pages

# Copy only the website content
git rm -rf .
cp -r website/* .
rm -rf website

# Commit and push
git add .
git commit -m "Deploy GitHub Pages"
git push origin gh-pages

# Go back to main branch
git checkout main
```

Then in GitHub Settings → Pages, select `gh-pages` as the source branch.

## 🎨 Customization

### Colors

The site uses CSS custom properties. Edit the `:root` section in `index.html`:

```css
:root {
    --primary: #6366f1;        /* Primary brand color */
    --secondary: #8b5cf6;      /* Secondary accent */
    --accent: #06b6d4;         /* Highlight color */
    /* ... */
}
```

## 📝 Features

The landing page includes:

- ✅ **Modern Design** - Gradient effects, smooth animations
- ✅ **Responsive** - Mobile-friendly layout
- ✅ **Stats Section** - Key metrics (0 deps, 254 tests, etc.)
- ✅ **Features Grid** - 9 core features highlighted
- ✅ **Code Example** - Syntax-highlighted quick start
- ✅ **Comparison Table** - VeloxAPI vs Express/Fastify/Koa
- ✅ **Sponsorship Section** - GitHub Sponsors integration with support options
- ✅ **Footer Links** - Documentation, examples, npm, sponsor
- ✅ **SEO Optimized** - Meta tags for search engines

## 🔗 Internal Links

The site links to:

- GitHub repository
- Documentation (`/docs`)
- Examples (`/examples`)
- Tutorials (`/learn`)
- npm package

Make sure these paths exist in your repository before publishing.

## 🛠️ Local Testing

To test the site locally:

```bash
# Using Python 3
cd website
python3 -m http.server 8000

# Using Node.js (http-server)
npx http-server website -p 8000

# Using PHP
cd website
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## 📊 Analytics (Optional)

To add Google Analytics:

1. Get your GA tracking ID
2. Add this before the closing `</head>` tag in `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

Replace `GA_MEASUREMENT_ID` with your actual ID.

---

**Built with ❤️ for VeloxAPI**
