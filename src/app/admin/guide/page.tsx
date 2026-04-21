"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface GuideSection {
  title: string;
  content: string[];
}

const guides: { category: string; sections: GuideSection[] }[] = [
  {
    category: "Dashboard",
    sections: [
      {
        title: "Overview",
        content: [
          "The Dashboard is your home screen when you log in to the admin panel. It shows key performance indicators (KPIs) at a glance including today's revenue, orders placed today, pending order count, low stock item count, and the number of currently firing scheduled alerts.",
          "Click the Active Alerts tile to jump straight to the Alerts page and review what's firing.",
          "Below the KPIs you'll find recent orders and low stock alerts. Use this page to quickly assess the health of your store each day.",
          "The bottom of the dashboard shows the system version number, build commit hash, and deployment date. Use this to confirm which version of the software is running.",
        ],
      },
    ],
  },
  {
    category: "Products",
    sections: [
      {
        title: "Managing Products",
        content: [
          "Navigate to Products to view all products in your store. Use the search bar to filter by name. Click a product name to edit it.",
          "To create a new product, click 'New Product' and fill in the required fields: Name, SKU, and Price. After creation you'll be redirected to the edit page where you can add images.",
        ],
      },
      {
        title: "Product Images",
        content: [
          "Each product supports up to 10 images. On the edit page, scroll to the Images section.",
          "Upload files: Click 'Upload File' or drag and drop an image onto the upload area. Images are stored in Google Cloud Storage.",
          "External URLs: Click 'Paste URL' to add an image hosted elsewhere.",
          "The first image added automatically becomes the primary image (shown in product listings). Hover over any image to set it as primary (star icon), delete it (trash icon), or drag to reorder.",
          "If you delete the primary image, the next image in the list is automatically promoted to primary.",
        ],
      },
      {
        title: "Bulk Edit",
        content: [
          "Bulk Edit lets you update multiple products at once in a spreadsheet-style table. Go to Products and click 'Bulk Edit'.",
          "Each row is one product. Edit Name, SKU, Price, Compare At Price, Cost Price, Weight, and Category directly in the table cells. Toggle Active, Featured, and Gift Eligible with the switches in each row.",
          "To edit content fields (Short Description, Tags, Allergens, Ingredients, Description), click the expand arrow at the left of any row to reveal a second row with those fields. Tags and allergens are comma-separated.",
          "Modified rows are highlighted. The header shows how many unsaved changes exist. Click 'Save Changes' to write all changes at once — only modified rows are sent to the server.",
          "Changes are not saved automatically. If you navigate away before saving, your edits will be lost.",
        ],
      },
      {
        title: "Bulk Import",
        content: [
          "Bulk Import creates new products from tab-delimited data — the format you get when you copy cells from a spreadsheet (Google Sheets, Excel).",
          "Go to Products and click 'Bulk Import'. Paste your data into the text area. The first row must be column headers.",
          "Required columns: name, sku, price. Optional columns: compareAtPrice, costPrice, weight, shortDescription, description, tags, allergens, ingredients, isActive, isFeatured, isGiftEligible, stock.",
          "Tags and allergens should be comma-separated within their cell (e.g. 'vegan,bestseller'). Boolean fields (isActive, isFeatured, isGiftEligible) use 'true' or 'false'.",
          "A live preview table appears below the paste area as soon as valid data is detected. It shows up to 20 rows. Review it before importing.",
          "Click 'Load Sample' to fill the text area with example data showing the expected format.",
          "After clicking Import, results show how many products were created and which rows failed (with error details). Failed rows do not block successful ones.",
          "Import creates new products only — it does not update existing ones. Duplicate SKUs will cause row-level errors.",
        ],
      },
    ],
  },
  {
    category: "Categories",
    sections: [
      {
        title: "Managing Categories",
        content: [
          "Categories organize your products for storefront navigation. Each category has a name, slug (URL path), description, and optional image.",
          "Use the sort order field to control the display order on the storefront. Categories can be activated or deactivated without deleting them.",
        ],
      },
    ],
  },
  {
    category: "Orders",
    sections: [
      {
        title: "Viewing Orders",
        content: [
          "The Orders page lists all orders with their status, customer name, item count, total, shipping method, and date. Click an order number to view full details including items, financial summary, shipping address, and payment info.",
        ],
      },
      {
        title: "Quick Actions on the Orders List",
        content: [
          "Each row in the orders list has two action icons on the right:",
          "Resend Receipt (envelope icon): Sends the order confirmation email to the customer again. Use this if a customer says they never received their receipt. The action is logged in the order's audit log.",
          "Cancel Order (X icon): Cancels the order after a confirmation prompt. Disabled for orders already in a final state (Cancelled or Refunded). This action is immediate and cannot be undone from the list — use the order detail page to change the status back if needed.",
        ],
      },
      {
        title: "Updating Order Status",
        content: [
          "On the order detail page, use the status dropdown to update an order. Available statuses: Pending, Confirmed, Processing, Shipped, Delivered, Cancelled, Refunded.",
          "When marking as Shipped, enter the tracking number and carrier. The customer will automatically receive a shipping notification email with tracking details.",
          "When marking as Delivered, the customer will receive a delivery confirmation email with a prompt to leave a review.",
          "The Admin Notes field lets you record internal notes visible only to staff. Notes are saved with each status update and logged in the audit trail.",
        ],
      },
      {
        title: "Order Audit Log",
        content: [
          "Every order detail page has an Audit Log section that shows a full history of all actions taken on that order.",
          "Logged events include: order creation, status changes (with previous and new values), tracking number updates, admin note updates, and receipt resends.",
          "Each entry shows a timestamp and the name of the admin who performed the action (if applicable). System-generated events (such as order creation at checkout) show without an admin name.",
          "The audit log is read-only and cannot be edited or deleted. It provides a permanent record for customer disputes or internal review.",
        ],
      },
    ],
  },
  {
    category: "Inventory",
    sections: [
      {
        title: "Stock Management",
        content: [
          "The Inventory page shows current stock levels for all products. Items below their low stock threshold are highlighted.",
          "To adjust stock, click a product and enter the new quantity. Select a reason (restock, adjustment, damage, return) and optionally add notes. All changes are logged for auditing.",
          "When inventory drops below the low stock threshold, an automatic email alert is sent to the store contact email.",
        ],
      },
    ],
  },
  {
    category: "Alerts",
    sections: [
      {
        title: "Scheduled Alerts & Reminders",
        content: [
          "The Alerts page (sidebar: Alerts) lets you schedule reminders that fire on a date or when a product's stock drops to a threshold. Use it for holiday prep, restocking deadlines, marketing milestones, or any recurring operational nudge.",
          "Two alert types are supported: Date-based (fires at a specific date and time) and Inventory-based (fires when a chosen product's current stock is at or below a threshold quantity you set).",
          "Each alert has a severity — Info, Warning, or Critical — that controls the badge color in the UI and the label prefix in the notification email.",
        ],
      },
      {
        title: "Creating a Date-Based Alert",
        content: [
          "Click 'New Alert', select 'Date-based', and enter a title plus an optional message. Severity defaults to Info.",
          "Pick a Trigger Date & Time using the date/time picker. The alert will fire as soon as the cron job runs after that time has passed.",
          "Holiday Presets (optional): Choose a holiday from the dropdown (Valentine's Day, Easter, Mother's Day, Father's Day, Halloween, Thanksgiving, Christmas), enter a lead time in days (default 60), and click Apply. The trigger date is automatically set to N days before the next occurrence of that holiday, and a default title is filled in if you haven't set one. This is the fastest way to set up seasonal prep reminders.",
        ],
      },
      {
        title: "Creating an Inventory-Based Alert",
        content: [
          "Click 'New Alert', select 'Inventory-based', and enter a title plus an optional message.",
          "Pick a product from the dropdown (all products including inactive ones are listed) and enter a threshold quantity. The alert fires when current stock for that product is at or below the threshold.",
          "Inventory alerts are independent of the global Low Stock email (which uses each product's own low stock threshold). Use inventory alerts when you want a one-off reminder tied to a specific stock level — e.g., 'reorder chocolate truffles when we hit 50 units before Mother's Day'.",
        ],
      },
      {
        title: "How Alerts Fire & Get Delivered",
        content: [
          "A cron job (POST /api/cron/alerts) scans the database on a schedule. For each unacknowledged alert whose firing condition is met and that has not yet been notified, it sends an email and stamps the alert as notified so it won't email again.",
          "Email recipients are every user with the Admin or Super Admin role (using the email address on their staff account). If no admin emails exist, it falls back to the store's contact email from Settings.",
          "The cron endpoint is protected by the CRON_SECRET environment variable — it must be configured on the server, and the cron caller must send 'Authorization: Bearer <CRON_SECRET>'. If CRON_SECRET is missing, the endpoint refuses to run.",
          "Email delivery uses the same Gmail integration as transactional emails. If Gmail is not configured, alert emails will fail and the failure will appear in the Email Log.",
        ],
      },
      {
        title: "Managing Active and Acknowledged Alerts",
        content: [
          "The Alerts page is split into two sections: Scheduled / Active (everything not yet acknowledged) and Acknowledged (dismissed alerts, shown faded).",
          "An alert in the active list shows a 'Firing' badge once its trigger condition has been met (date passed, or inventory at/below threshold). Before that, it's scheduled but waiting.",
          "Click the checkmark icon to acknowledge an alert (moves it to the Acknowledged section and prevents further notifications). Click it again on an acknowledged alert to mark it active again.",
          "Click the trash icon to delete an alert permanently. There is no undo.",
        ],
      },
    ],
  },
  {
    category: "Customers",
    sections: [
      {
        title: "Customer Management",
        content: [
          "The Customers page shows all registered customers (not staff). View their name, email, join date, order count, and total spending.",
          "Click a customer name to view their full profile including order history and saved addresses.",
        ],
      },
    ],
  },
  {
    category: "Staff",
    sections: [
      {
        title: "Staff Management (Super Admin Only)",
        content: [
          "The Staff page is only visible to Super Admins. It lists all users with Admin or Super Admin roles.",
          "Click 'Add Staff' to create a new admin account. Choose between Admin and Super Admin roles.",
          "Admin: Can manage products, categories, orders, inventory, customers, interactions, coupons, reviews, and view analytics/email logs.",
          "Super Admin: Everything an Admin can do, plus manage staff accounts, configure site settings, branding, integrations (GCS, Gmail), and toggle feature flags.",
        ],
      },
      {
        title: "Editing Staff",
        content: [
          "Click a staff member's name to edit their profile, change their role, or reset their password.",
          "Use 'Revoke Access' to remove admin privileges. This downgrades the user to a regular customer account — it does not delete their data.",
          "You cannot demote yourself or revoke your own access.",
        ],
      },
    ],
  },
  {
    category: "Interactions",
    sections: [
      {
        title: "Customer Interactions",
        content: [
          "Track all customer communications in one place. Interaction types include: Notes, Email Sent, Phone Call, Complaint, Return Request, and Feedback.",
          "Each interaction has a status (Open, In Progress, Resolved, Closed) and priority level (Low, Medium, High, Urgent).",
          "Use this to maintain a history of all customer touchpoints for better support.",
        ],
      },
    ],
  },
  {
    category: "Coupons",
    sections: [
      {
        title: "Creating Coupons",
        content: [
          "Create discount codes for your customers. Three coupon types are available:",
          "Percentage: A percentage off the order (e.g., 10% off).",
          "Fixed: A fixed dollar amount off (e.g., $5 off).",
          "Free Shipping: Waives the shipping cost.",
          "Set optional constraints: minimum order amount, maximum uses, and expiration date. Toggle coupons active/inactive without deleting them.",
        ],
      },
    ],
  },
  {
    category: "Reviews",
    sections: [
      {
        title: "Review Moderation",
        content: [
          "All customer reviews require approval before appearing on the storefront. The Reviews page shows pending and approved reviews.",
          "Click to approve or reject a review. You can also add an admin response that will be displayed publicly beneath the customer's review.",
        ],
      },
    ],
  },
  {
    category: "Analytics",
    sections: [
      {
        title: "Analytics Dashboard",
        content: [
          "The Analytics page provides visual insights into your store's performance with interactive charts.",
          "Available charts include: Revenue over time, Orders by status, Top selling products, Customer growth, Revenue by category, Average order value trends, and more.",
          "Use this data to identify trends, popular products, and growth opportunities.",
        ],
      },
    ],
  },
  {
    category: "Email Log",
    sections: [
      {
        title: "Email Tracking",
        content: [
          "Every email sent through the system is logged here. View the recipient, subject, template used, status (Sent/Failed), and timestamp.",
          "If an email fails to send, the error is logged. Check this page to diagnose delivery issues.",
        ],
      },
      {
        title: "Automatic Email Triggers",
        content: [
          "The following emails are sent automatically by the system — no admin action required:",
          "Welcome: Sent to the customer immediately after they register an account.",
          "Order Confirmation: Sent to the customer after a successful checkout. Includes itemized order details, subtotal, shipping, tax, and total.",
          "Order Shipped: Sent when an order is marked Shipped. Includes the tracking number and carrier entered by the admin.",
          "Order Delivered: Sent when an order is marked Delivered. Includes a prompt for the customer to leave a review.",
          "Low Stock Alert: Sent to the store contact email when one or more active products fall at or below their low stock threshold. Lists all affected products with current quantity and threshold.",
          "All five templates use the Gmail integration configured in Settings. If Gmail is not configured, emails will fail and errors will appear in this log.",
        ],
      },
    ],
  },
  {
    category: "Settings",
    sections: [
      {
        title: "Branding (Super Admin Only)",
        content: [
          "Configure your store's name, tagline, description, and URL. Changes override the defaults in site.config.ts and take effect on the next page load.",
          "Upload a logo to replace the text site name across all public pages. Upload a favicon to customize the browser tab icon. Both are stored in Google Cloud Storage.",
        ],
      },
      {
        title: "Business Settings",
        content: [
          "Set your tax rate and free shipping threshold. Configure shipping rates for Standard, Express, and Overnight delivery methods.",
        ],
      },
      {
        title: "Contact & Social",
        content: [
          "Update your store's contact email, phone number, and address. These appear in the storefront footer.",
          "Add links to your social media profiles (Instagram, Facebook, TikTok, Twitter).",
        ],
      },
      {
        title: "Feature Flags",
        content: [
          "Toggle features on and off without code changes. Available flags: Build Your Own Box, Gift Messages, Subscriptions, Reviews, Wishlist, and Loyalty Points.",
        ],
      },
      {
        title: "Google Cloud Storage",
        content: [
          "Configure GCS for image uploads. Enter your Project ID, Bucket Name, and upload a Service Account JSON key.",
          "Use the 'Test Connection' button to verify your configuration before saving. Product images, logos, and favicons are all stored in GCS.",
        ],
      },
      {
        title: "Gmail Integration",
        content: [
          "Configure Gmail API for sending transactional emails. You'll need an OAuth2 Client ID, Client Secret, and Refresh Token from Google Cloud Console.",
          "To obtain a refresh token: use the OAuth2 Playground (developers.google.com/oauthplayground) with your own credentials, authorize the Gmail scope, and exchange for tokens.",
          "Use 'Test Connection' to verify the configuration. The 'Send From' address determines the sender shown in customer emails.",
        ],
      },
    ],
  },
];

function GuideSectionItem({ section }: { section: GuideSection }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-3 px-1 text-left hover:text-brand-primary transition-colors"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        )}
        <span className="font-medium text-sm">{section.title}</span>
      </button>
      {open && (
        <div className="pl-7 pb-4 space-y-2">
          {section.content.map((paragraph, i) => (
            <p key={i} className="text-sm text-brand-text-secondary leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminGuidePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">
          Admin Guide
        </h1>
        <p className="text-sm text-brand-text-muted mt-1">
          Documentation for all admin panel features. Click a topic to expand.
        </p>
      </div>

      <div className="space-y-4 max-w-3xl">
        {guides.map((group) => (
          <div key={group.category} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h2 className="font-heading font-semibold text-brand-secondary">
                {group.category}
              </h2>
            </div>
            <div className="px-5">
              {group.sections.map((section) => (
                <GuideSectionItem key={section.title} section={section} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
