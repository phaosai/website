import {
  Printer,
  Wrench,
  Headphones,
  Server,
  Users,
  ShoppingCart,
  FileText,
  MapPin,
  Route,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  Plug,
  Truck,
  Shield,
  Clock,
  PenTool,
  Globe,
  Zap,
  Settings,
  Monitor,
} from "lucide-react";

export interface Integration {
  name: string;
  description: string;
  icon: React.ElementType;
}

export interface IntegrationCategory {
  title: string;
  integrations: Integration[];
  icon: React.ElementType;
}

const mpsIntegrations: Integration[] = [
  { name: "PaperCut MF", description: "Export usage logs and track printer health, toner levels, and user print behavior in real-time", icon: Printer },
  { name: "ezeep Blue", description: "Natively integrated — trigger workflows on new print jobs and log them automatically for billing", icon: Printer },
  { name: "Cloudprinter.com", description: "Trigger AI voice agent calls to customers with delivery updates on order status changes", icon: Printer },
  { name: "Print Autopilot", description: "Automate document workflows and streamline print production processes end-to-end", icon: Printer },
  { name: "SNMP Monitoring (Syncro/MSP)", description: "Trigger service workflows when printers report error codes like paper jams or fuser errors", icon: Wrench },
];

const erpIntegrations: Integration[] = [
  { name: "ConnectWise Manage", description: "Create tickets, update project statuses, and log ticket notes automatically from AI interactions", icon: Headphones },
  { name: "Syncro MSP", description: "Trigger service appointments from RMM alerts and sync printer monitoring data seamlessly", icon: Server },
  { name: "Tigerpaw", description: "Sync customer contacts and service assets via REST API and webhook integrations", icon: Server },
  { name: "e-automate (ECI)", description: "Pull meter reads into Phaos for automated billing workflows via SQL-to-Web connections", icon: Server },
  { name: "HaloPSA", description: "Modern, flexible PSA with deep API access — automate ticket creation, time tracking, and asset management", icon: Server },
  { name: "Autotask (Datto/Kaseya)", description: "One of the leading PSAs for IT and managed services — sync tickets, contracts, and billing data", icon: Server },
  { name: "ServiceNow", description: "Enterprise-grade ITSM for large-scale managed print contracts and global service operations", icon: Shield },
  { name: "Zuper", description: "Modern field service management built for agile teams — real-time dispatching and workforce optimization", icon: Settings },
  { name: "Atera", description: "Combined RMM and PSA platform popular with MSPs — monitor endpoints and manage service in one place", icon: Monitor },
  { name: "Pulseway", description: "All-in-one IT service provider platform with deep automation and remote monitoring capabilities", icon: Zap },
  { name: "Freshservice", description: "ITIL-aligned service desk from Freshworks — excellent for internal hardware support and change management", icon: Headphones },
  { name: "RepairShopr", description: "Purpose-built for hardware repair shops — manage intake, repair tracking, and invoicing for print depots", icon: Wrench },
  { name: "NinjaOne (NinjaRMM)", description: "Increasingly used by service providers to manage and monitor customer endpoints and connected devices", icon: Monitor },
  { name: "Kaseya VSA", description: "Large-scale IT management platform for enterprise service teams — automate patching, alerts, and remediation", icon: Server },
];

const crmIntegrations: Integration[] = [
  { name: "SalesChain", description: "Industry leader for Quote-to-Cash in office equipment — manage complex lease cycles and capital equipment billing. Automation: Trigger AI outreach when leases near expiration to discuss upgrades", icon: Users },
  { name: "Sherpa CRM (White Cup)", description: "Revenue Intelligence platform combining ERP data with sales activity to identify at-risk accounts. Automation: Parse business intelligence alerts and draft personalized outreach for declining accounts", icon: Users },
  { name: "AgentDealer", description: "Salesforce-powered CRM pre-configured for copier dealers with equipment asset tracking and meter-based billing. Automation: Notify customers about high-volume alternatives when usage alerts trigger", icon: Users },
  { name: "Compass Sales Solutions", description: "Specialized for MPS providers — TCO assessments and automated proposal generation built in. Automation: Monitor proposal views via webhook and trigger AI follow-up calls", icon: Users },
  { name: "Close CRM", description: "Action-first CRM with built-in calling and SMS — the fastest platform for MSP and IT services sales teams. Automation: Sync full AI conversation transcripts directly into the Close timeline", icon: Users },
  { name: "HubSpot", description: "World leader in inbound marketing with a Flywheel model ideal for digital-first lead generation. Automation: Trigger AI outreach when leads engage with specific content or landing pages", icon: Users },
  { name: "Pipedrive", description: "Visual Kanban-style CRM built around Activity-Based Selling to keep field reps focused on deal-moving actions. Automation: Auto-schedule site walk-throughs when deals enter the Discovery stage", icon: Users },
  { name: "Zoho CRM", description: "Best value-to-feature ratio with a massive ecosystem including inventory and service desk modules. Automation: Use Blueprints to trigger AI tasks at specific equipment installation milestones", icon: Users },
  { name: "Microsoft Dynamics 365", description: "Enterprise standard for large-scale operations with deep native Microsoft 365 and Teams integration. Automation: Update Dynamics records in real-time from conversations within Teams", icon: Users },
  { name: "Salesforce", description: "The #1 AI CRM globally with virtually infinite customization through the Agentforce ecosystem. Automation: Map complex custom objects like serial numbers directly into AI workflows via Zapier", icon: Users },
];

const ecommerceIntegrations: Integration[] = [
  { name: "Shopify", description: "AI checks fulfillment status when customers ask about orders — real-time lookups during calls", icon: ShoppingCart },
  { name: "WooCommerce", description: "Manage online supply catalogs and trigger AI updates on order events and inventory changes", icon: ShoppingCart },
  { name: "Magento", description: "Sync enterprise-level catalog data for automated reordering and product availability updates", icon: ShoppingCart },
];

const documentIntegrations: Integration[] = [
  { name: "PDF.co", description: "AI-powered document processor that reads scanned PDFs, extracts data like serial numbers, and sends it to your ERP", icon: FileText },
  { name: "Docparser", description: "Extract specific data from complex PDFs and invoices, then route it via webhook to your connected systems", icon: FileText },
  { name: "PandaDoc", description: "Create, send, and track legally binding electronic signatures with real-time document status updates", icon: PenTool },
  { name: "CloudConvert", description: "Convert nearly any file type into print-ready formats — automate document preparation across workflows", icon: FileText },
  { name: "Formstack Documents", description: "Merge AI-generated data into professional templates for proposals, contracts, and service agreements", icon: FileText },
  { name: "Adobe Acrobat Sign", description: "Enterprise-grade document signing with robust automation — trigger signatures from AI workflow events", icon: PenTool },
  { name: "DocuSign", description: "Industry-standard e-signatures heavily used by office equipment dealers for contracts and service agreements", icon: PenTool },
  { name: "Paperform", description: "Complex data collection and document generation in one step — ideal for service intake and onboarding forms", icon: FileText },
  { name: "PDFfiller", description: "Edit existing PDFs and add AI-filled fields automatically — perfect for pre-populating service forms", icon: FileText },
  { name: "Plumsail Documents", description: "Generate professional PDFs and Word documents from your application's JSON data with powerful templating", icon: FileText },
  { name: "Docurama", description: "AI-first document management and parsing — intelligently categorize, extract, and route document data", icon: FileText },
];

const fieldServiceIntegrations: Integration[] = [
  { name: "ServiceTitan", description: "The heavyweight for field service — dispatch technicians, manage jobs, and track service history at scale", icon: MapPin },
  { name: "Housecall Pro", description: "User-friendly field service platform with deep automation triggers for scheduling, invoicing, and dispatching", icon: MapPin },
  { name: "Jobber", description: "Manage quotes, scheduling, and invoicing for smaller service teams — streamlined and easy to integrate", icon: MapPin },
  { name: "MFR - Field Service Management", description: "Strong worldwide API and Zapier support for managing complex field service operations", icon: Globe },
  { name: "Fleetio", description: "Manage the vehicle fleet used by service technicians — track maintenance, fuel, and utilization", icon: Truck },
  { name: "Samsara", description: "Logistics tracking and fleet management for equipment deliveries and installation teams", icon: Truck },
  { name: "Bringg", description: "Delivery orchestration platform for complex logistics — coordinate multi-stop routes and real-time tracking", icon: Route },
  { name: "Route4Me", description: "Optimize technician routes based on AI-created service tickets — reduce drive time and boost efficiency", icon: Route },
  { name: "Simpro", description: "Built for trade contractors and complex project service management — quotes, jobs, and invoicing", icon: MapPin },
  { name: "MaintainX", description: "Manage preventive maintenance and work orders for print hardware — digital checklists and audit trails", icon: Wrench },
];

const calendarIntegrations: Integration[] = [
  { name: "Google Calendar", description: "AI finds open slots and books appointments during live customer conversations automatically", icon: Calendar },
  { name: "Microsoft Outlook / Office 365", description: "Enterprise scheduling, calendar sync, and email routing for automated follow-ups", icon: Calendar },
  { name: "Calendly", description: "The gold standard for appointment scheduling — massive integration support and seamless booking flows", icon: Calendar },
  { name: "YouCanBook.me", description: "Highly customizable scheduling for enterprise teams with advanced availability and routing rules", icon: Calendar },
  { name: "Acuity Scheduling", description: "Powerful booking with payment collection and complex intake forms built into the scheduling flow", icon: Calendar },
  { name: "OnceHub (ScheduleOnce)", description: "Complex routing logic — automatically assign the right technician based on skill, location, and availability", icon: Calendar },
  { name: "SimplyBook.me", description: "Comprehensive booking system built for large service teams managing multiple locations and resources", icon: Calendar },
  { name: "Teamup", description: "Shared calendar designed for teams managing resources, equipment, and technician availability", icon: Calendar },
  { name: "Cal.com", description: "Open-source, highly flexible scheduling that works beautifully with webhooks and custom integrations", icon: Calendar },
  { name: "Doodle", description: "Coordinate large group meetings, training sessions, and multi-stakeholder scheduling effortlessly", icon: Clock },
  { name: "Appointy", description: "Simple and effective scheduling for service-based businesses with automated reminders and follow-ups", icon: Calendar },
  { name: "Vocus.io", description: "Specialized for sales teams — cold outreach scheduling, email sequences, and meeting booking in one", icon: Calendar },
];

const communicationIntegrations: Integration[] = [
  { name: "Slack", description: "AI drops summaries of high-priority service calls into team channels for instant awareness", icon: MessageSquare },
  { name: "Twilio", description: "Send automated SMS to customers — appointment confirmations, technician ETAs, and status updates", icon: Phone },
  { name: "Gmail / Office 365 Email", description: "Send structured, automated follow-up emails post-call with full conversation context", icon: Mail },
  { name: "Discord", description: "High-engagement community and internal team communication — push AI alerts and updates to channels", icon: MessageSquare },
  { name: "Microsoft Teams", description: "The primary internal chat for most service dealers — route AI summaries, alerts, and approvals directly", icon: MessageSquare },
  { name: "MessageBird", description: "Global multi-channel platform supporting WhatsApp, SMS, and Voice — reach customers on their preferred channel", icon: Globe },
  { name: "Intercom", description: "AI-to-human handoffs within a customer success chat widget — seamless escalation when conversations need a person", icon: MessageSquare },
  { name: "Zendesk", description: "Professional ticket-based communication and customer support — auto-create and update tickets from AI interactions", icon: Headphones },
  { name: "Front", description: "Shared inbox that turns email and SMS into collaborative team tasks — perfect for service coordination", icon: Mail },
  { name: "WhatsApp Business", description: "Critical for international clients and mobile-first service teams — send updates, confirmations, and alerts", icon: Phone },
  { name: "Don't See Your Application?", description: "Ask us if we can quickly and easily connect to your specific systems! If there are Zapier Triggers or webhooks, we can make it happen quick and painless.", icon: Plug },
];

export const categories: IntegrationCategory[] = [
  { title: "Managed Print Services & Print Management", integrations: mpsIntegrations, icon: Printer },
  { title: "Industry-Specific ERPs & PSAs", integrations: erpIntegrations, icon: Server },
  { title: "CRM & Sales", integrations: crmIntegrations, icon: Users },
  { title: "E-Commerce & Inventory", integrations: ecommerceIntegrations, icon: ShoppingCart },
  { title: "Document & Form Automation", integrations: documentIntegrations, icon: FileText },
  { title: "Field Service & Logistics", integrations: fieldServiceIntegrations, icon: MapPin },
  { title: "Scheduling & Calendar", integrations: calendarIntegrations, icon: Calendar },
  { title: "Multi-Channel Communication", integrations: communicationIntegrations, icon: MessageSquare },
];
