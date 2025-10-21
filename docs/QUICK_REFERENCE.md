# 📚 Quick Reference - AiCapital Documentation

## 🚀 Most Common Docs (Quick Access)

### Just Starting?
- **[Email Setup (5 min)](email/START_HERE_EMAIL_SETUP.md)** ⭐ Start here!
- **[Architecture Overview](Architecture.md)** - Understand the system
- **[Main README](../README.md)** - Project overview

### Deploying to Production?
1. **[Email Setup Guide](email/EMAIL_SETUP_GUIDE.md)** - Professional email
2. **[Stripe Setup](payments/STRIPE_SETUP_GUIDE.md)** - Payment integration
3. **[Render Deployment](deployment/RENDER_DEPLOYMENT_GUIDE.md)** - Deploy app

### Working on Features?
- **[Current Sprint](project-management/CURRENT_SPRINT.md)** - What's happening now
- **[TODO List](project-management/TODO_REMAINING.md)** - What needs to be done
- **[Feature Docs](features/)** - Specific feature documentation

### Need Technical Info?
- **[Architecture](Architecture.md)** - System design
- **[Data Providers](DataProviders.md)** - API integrations
- **[Decision Engine](DecisionEngine.md)** - AI algorithm
- **[Runbook](Runbook.md)** - Operations guide

---

## 📁 Folder Structure

```
docs/
├── email/                     (4 files)  📧 Email service setup
├── deployment/                (3 files)  🚀 Deployment guides
├── payments/                  (2 files)  💳 Payment integration
├── project-management/       (19 files)  📊 Sprints & TODOs
├── features/                  (4 files)  ✨ Feature docs
└── (root)                     (8 files)  🏗️ Technical architecture
```

**Total: 40 documentation files** organized and accessible!

---

## 🎯 Quick Commands

### Find Documentation
```bash
# List all docs
ls docs/**/*.md

# Search for keyword
grep -r "keyword" docs/

# Count total files
find docs/ -name "*.md" | wc -l
```

### Navigate Folders
```bash
# Email docs
cd docs/email/

# Deployment docs
cd docs/deployment/

# Project management
cd docs/project-management/
```

---

## 📖 Documentation by Purpose

### Setup & Configuration
- **Email**: `docs/email/START_HERE_EMAIL_SETUP.md`
- **Payments**: `docs/payments/STRIPE_SETUP_GUIDE.md`
- **Database**: `docs/Redis-Setup.md`
- **Deployment**: `docs/deployment/RENDER_DEPLOYMENT_GUIDE.md`

### Development
- **Architecture**: `docs/Architecture.md`
- **API Integration**: `docs/DataProviders.md`
- **Decision Logic**: `docs/DecisionEngine.md`
- **Operations**: `docs/Runbook.md`

### Project Management
- **Current Work**: `docs/project-management/CURRENT_SPRINT.md`
- **Remaining Tasks**: `docs/project-management/TODO_REMAINING.md`
- **Progress**: `docs/project-management/PROGRESS_SUMMARY.md`
- **Fixes**: `docs/project-management/CRITICAL_FIXES_STATUS.md`

### Features
- **Watchlist**: `docs/features/WATCHLIST_SYSTEM_STATUS.md`
- **Google Finance**: `docs/features/GOOGLE_FINANCE_IMPLEMENTATION.md`
- **Mobile**: `docs/features/GOOGLE_PLAY_ROADMAP.md`

---

## 🔍 Search Tips

### Find by Keyword
```bash
# Find email setup docs
grep -r "EMAIL" docs/

# Find deployment guides
grep -r "deploy" docs/ -i

# Find TODO items
grep -r "TODO" docs/project-management/
```

### Browse by Category
1. **Email**: All in `docs/email/`
2. **Deploy**: All in `docs/deployment/`
3. **Payments**: All in `docs/payments/`
4. **Management**: All in `docs/project-management/`
5. **Features**: All in `docs/features/`

---

## 💡 Tips

✅ **Bookmark** frequently used docs
✅ **Check** `docs/README.md` for complete index
✅ **Update** docs when making changes
✅ **Link** between related documentation
✅ **Keep** root folder clean (docs go in `/docs/`)

---

## 🆘 Need Help?

**Can't find what you need?**
1. Check [docs/README.md](README.md) - Complete navigation
2. Search using keywords
3. Browse folder by category
4. Check main [README.md](../README.md)

**Creating new docs?**
1. Put in appropriate folder
2. Update `docs/README.md`
3. Follow naming conventions
4. Link from other docs

---

**Last Updated**: October 21, 2025
**Total Files**: 40 markdown files
**Status**: ✅ Organized & Ready

