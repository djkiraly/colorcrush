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
          "The Dashboard is your home screen when you log in to the admin panel. It shows key performance indicators (KPIs) at a glance including total revenue, order count, customer count, and average order value.",
          "Below the KPIs you'll find recent orders and low stock alerts. Use this page to quickly assess the health of your store each day.",
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
          "The Orders page lists all orders with their status, customer name, total, and date. Click an order number to view full details including items, shipping address, and payment info.",
        ],
      },
      {
        title: "Updating Order Status",
        content: [
          "On the order detail page, use the status dropdown to update an order. Available statuses: Pending, Confirmed, Processing, Shipped, Delivered, Cancelled, Refunded.",
          "When marking as Shipped, enter the tracking number and carrier. The customer will automatically receive a shipping notification email with tracking details.",
          "When marking as Delivered, the customer will receive a delivery confirmation email with a prompt to leave a review.",
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
          "Emails are automatically sent for: Welcome (on registration), Order Confirmation (after checkout), Order Shipped, Order Delivered, and Low Stock Alerts.",
          "If an email fails to send, the error is logged. Check this page to diagnose delivery issues.",
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
