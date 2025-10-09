## EVENT TRACKING
- [ ] Add events collection (login, add_stock, decision_view, upgrade)
- [ ] /api/admin/analytics/summary → users, MRR, churn rate
- [ ] Cron → aggregate daily metrics

## ADMIN ANALYTICS UI (/admin/analytics.tsx)
- [ ] Recharts line charts (MRR, Active Users)
- [ ] Table of churned users (last 7 days)

## RETENTION FLOWS
- [ ] Email template "Come back to AI Capital"
- [ ] Cron detects inactive > 30 days → send email
- [ ] Add invitedBy and utmSource fields
- [ ] API /api/analytics/utm for traffic quality

## IN-APP ENGAGEMENT
- [ ] Weekly summary banner ("Your portfolio +4.6 % this week")
- [ ] "Avi Bot" advisor message component
- [ ] Push notifications (Firebase / OneSignal)
