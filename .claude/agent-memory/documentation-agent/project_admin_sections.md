---
name: Admin portal section inventory
description: All admin sections, their source file locations, and guide documentation status as of 2026-04-02
type: project
---

Documented categories in the guide as of 2026-04-02:

| Category | Key sections | Source files |
|---|---|---|
| Dashboard | Overview, System Version | src/app/admin/page.tsx |
| Products | Managing Products, Product Images, Bulk Edit, Bulk Import | src/app/admin/products/, src/app/admin/products/bulk-edit/page.tsx, src/app/admin/products/import/page.tsx, src/components/admin/ProductImageManager.tsx |
| Categories | Managing Categories | src/app/admin/categories/ |
| Orders | Viewing Orders, Quick Actions, Updating Status, Audit Log | src/app/admin/orders/page.tsx, src/app/admin/orders/[id]/page.tsx, src/lib/order-audit.ts |
| Inventory | Stock Management | src/app/admin/inventory/ |
| Customers | Customer Management | src/app/admin/customers/ |
| Staff | Staff Management, Editing Staff | src/app/admin/staff/, src/app/admin/staff/new/, src/app/admin/staff/[id]/ |
| Interactions | Customer Interactions | src/app/admin/interactions/ |
| Coupons | Creating Coupons | src/app/admin/coupons/ |
| Reviews | Review Moderation | src/app/admin/reviews/ |
| Analytics | Analytics Dashboard | src/app/admin/analytics/ |
| Email Log | Email Tracking, Automatic Email Triggers | src/lib/email-notifications.ts |
| Settings | Branding, Business, Contact/Social, Feature Flags, GCS, Gmail | src/app/admin/settings/ |

Email notification triggers (src/lib/email-notifications.ts):
- sendWelcomeEmail — on registration
- sendOrderConfirmationEmail — after checkout
- sendOrderShippedEmail — when status set to Shipped
- sendOrderDeliveredEmail — when status set to Delivered
- sendLowStockAlerts — when active products are at or below lowStockThreshold

Order audit log actions (src/lib/order-audit.ts + src/app/admin/orders/[id]/page.tsx):
- order_created, status_changed, tracking_updated, notes_updated, receipt_resent

**How to apply:** Use as a checklist when auditing documentation completeness or when a new feature is added to one of these sections.
