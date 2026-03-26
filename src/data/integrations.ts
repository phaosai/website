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
  Package,
  BarChart3,
  Layers,
  Box,
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
  { name: "PaperCut (Hive/MF)", description: "Enterprise print management with usage tracking, quota enforcement, and environmental reporting. AI Automation Example: Triggers a Phaos AI 'Policy Compliance' nudge to the department head when a user or group exceeds their monthly color printing quota or budget.", icon: Printer },
  { name: "PrinterLogic", description: "Serverless printing infrastructure that eliminates print servers and simplifies driver management. AI Automation Example: Automatically generates an AI-written 'Site Optimization Report' when a new printer is added, suggesting the best driver and security settings.", icon: Printer },
  { name: "Printix (by Kofax)", description: "Cloud-native print management with secure release and mobile printing across distributed workforces. AI Automation Example: Initiates a Phaos AI 'Onboarding Guide' for new employees added to a Printix group, walking them through secure print release on mobile devices.", icon: Printer },
  { name: "ezeep Blue", description: "Natively integrated cloud printing — trigger workflows on new print jobs and log them automatically for billing. AI Automation Example: Executes a Phaos AI 'Supply Chain' trigger to check paper and toner inventory the moment a high-volume job is sent to a remote office.", icon: Printer },
  { name: "YSoft SafeQ", description: "Enterprise print and scan management with advanced security, cost control, and workflow automation. AI Automation Example: Deploys a Phaos AI 'Security Audit' alert to IT admins when sensitive document titles are detected in the print queue but not released within 24 hours.", icon: Shield },
  { name: "MyQ Solution", description: "Flexible print management with secure pull-printing, scanning workflows, and sustainability reporting. AI Automation Example: Triggers a Phaos AI 'Green Initiative' report for the CFO, highlighting monthly carbon footprint savings and paper reduction achieved through secure print release.", icon: Printer },
  { name: "PrintTracker", description: "Industry-leading data collection agent for remote monitoring of printer fleets and supply levels. AI Automation Example: Launches a Phaos AI 'Proactive Service' ticket the moment a 'Critical Error Code' is captured via DCA, providing the technician with exact parts needed.", icon: Wrench },
  { name: "Printanista (ECI)", description: "Comprehensive fleet management with automated meter collection, supply fulfillment, and contract billing. AI Automation Example: Automatically calculates 'Cost-per-Page' drift and notifies the Account Manager if usage deviates by more than 15% from the contract baseline.", icon: BarChart3 },
  { name: "Xerox Workplace Cloud", description: "Cloud-based print and content management designed for hybrid and distributed work environments. AI Automation Example: Triggers a Phaos AI 'Home Office Audit' for remote workers, tracking business-related print volumes on non-contract devices for expense reimbursement.", icon: Globe },
  { name: "HP JetAdvantage Insights", description: "Fleet analytics and optimization platform delivering actionable intelligence on device utilization and costs. AI Automation Example: Uses Phaos AI to analyze fleet utilization data and automatically recommend 'Device Consolidation' plans during quarterly business reviews.", icon: BarChart3 },
  { name: "Lexmark Cloud Services", description: "Enterprise-grade cloud fleet management with predictive analytics and remote device diagnostics. AI Automation Example: Activates a Phaos AI 'Predictive Maintenance' sequence that schedules a service visit when telemetry predicts a fuser failure within the next 5,000 pages.", icon: Settings },
  { name: "FMAudit (ECI)", description: "Automated data collection and fleet monitoring for managed print service providers worldwide. AI Automation Example: Triggers a Phaos AI 'Toner Concierge' workflow that confirms the customer's shipping address and contact before automatically releasing a low-toner supply shipment.", icon: Printer },
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
  { name: "SalesChain", description: "Industry leader for Quote-to-Cash in office equipment — manage complex lease cycles and capital equipment billing. AI Automation Example: Automatically initiates personalized upgrade consultations when equipment leases hit the 9-month maturity window to preempt competitor buyouts.", icon: Users },
  { name: "Sherpa CRM (White Cup)", description: "Revenue Intelligence platform combining ERP data with sales activity to identify at-risk accounts. AI Automation Example: Deploys a Phaos AI 'Health Check' sequence immediately when revenue intelligence flags a drop in customer print volume to catch at-risk accounts.", icon: Users },
  { name: "AgentDealer", description: "Salesforce-powered CRM pre-configured for copier dealers with equipment asset tracking and meter-based billing. AI Automation Example: Triggers instant AI outreach to fleet managers when specific serial numbers hit over-utilization thresholds, recommending higher-capacity hardware.", icon: Users },
  { name: "Compass Sales Solutions", description: "Specialized for MPS providers — TCO assessments and automated proposal generation built in. AI Automation Example: Activates a Phaos AI follow-up via SMS the moment a prospect views a Managed Print proposal, ensuring high-intent engagement while the data is fresh.", icon: Users },
  { name: "Close CRM", description: "Action-first CRM with built-in calling and SMS — the fastest platform for MSP and IT services sales teams. AI Automation Example: Executes an immediate, multi-channel qualification conversation within 60 seconds of a new lead creation to filter high-value opportunities.", icon: Users },
  { name: "HubSpot", description: "World leader in inbound marketing with a Flywheel model ideal for digital-first lead generation. AI Automation Example: Launches a targeted AI dialogue centered on security and compliance requirements immediately after a prospect downloads a technical whitepaper.", icon: Users },
  { name: "Pipedrive", description: "Visual Kanban-style CRM built around Activity-Based Selling to keep field reps focused on deal-moving actions. AI Automation Example: Automates the coordination and scheduling of site walk-throughs and discovery meetings the moment a deal enters a new pipeline stage.", icon: Users },
  { name: "Zoho CRM", description: "Best value-to-feature ratio with a massive ecosystem including inventory and service desk modules. AI Automation Example: Bridges service and sales by triggering an AI 'Replacement Quote' workflow for customers who experience three or more hardware service calls within 60 days.", icon: Users },
  { name: "Microsoft Dynamics 365", description: "Enterprise standard for large-scale operations with deep native Microsoft 365 and Teams integration. AI Automation Example: Synchronizes enterprise fleet expansion plans by cross-referencing new client office locations with existing service territory maps.", icon: Users },
  { name: "Salesforce", description: "The #1 AI CRM globally with virtually infinite customization through the Agentforce ecosystem. AI Automation Example: Manages end-to-end negotiation and seat-expansion dialogue for expiring software licenses by monitoring custom asset objects in real-time.", icon: Users },
  { name: "SugarCRM", description: "Flexible, developer-friendly CRM with powerful workflow automation and deep customization capabilities. AI Automation Example: Scans CRM notes for competitor mentions to instantly arm sales reps with AI-generated battle cards and comparison data before their next meeting.", icon: Users },
  { name: "Keap", description: "All-in-one CRM and marketing automation platform built for small businesses and growing service teams. AI Automation Example: Resurrects 'Lost Opportunities' after six months by deploying a low-pressure AI check-in sequence to identify dissatisfaction with the current provider.", icon: Users },
];

const ecommerceIntegrations: Integration[] = [
  { name: "Shopify", description: "The leading e-commerce platform for online storefronts with extensive app ecosystem and fulfillment tools. AI Automation Example: Triggers Phaos AI to perform a real-time fraud and 'print-readiness' audit on high-value orders, flagging low-resolution artwork before production.", icon: ShoppingCart },
  { name: "WooCommerce", description: "Open-source e-commerce on WordPress with unlimited flexibility for custom catalog and order workflows. AI Automation Example: Initiates an AI-driven 'Cross-Sell' outreach when a customer purchases a specific printer model, suggesting compatible paper and toner bundles.", icon: ShoppingCart },
  { name: "BigCommerce", description: "Enterprise-grade e-commerce with powerful B2B features, multi-channel selling, and headless commerce support. AI Automation Example: Executes a Phaos AI 'Bulk Order Concierge' workflow for B2B accounts placing high-volume orders, generating custom contract pricing.", icon: ShoppingCart },
  { name: "ShipStation", description: "Multi-carrier shipping platform that automates label creation, tracking, and delivery notifications at scale. AI Automation Example: Triggers a Phaos AI 'Delivery Intelligence' notification if the carrier reports a delay, proactively offering solutions before the customer contacts support.", icon: Truck },
  { name: "Cin7 Core", description: "Comprehensive inventory and order management connecting sales channels, warehouses, and supply chain operations. AI Automation Example: Analyzes stock level updates to automatically draft and send purchase orders to suppliers when specialized print substrates dip below safety stock.", icon: Package },
  { name: "Katana Cloud Manufacturing", description: "Real-time manufacturing ERP with live inventory tracking, production planning, and shop floor management. AI Automation Example: Triggers an AI 'Production Schedule Optimization' alert when a rush order is placed, identifying the best equipment and shift to minimize lead time.", icon: Settings },
  { name: "Zoho Inventory", description: "End-to-end inventory management with multi-warehouse support, serial tracking, and deep Zoho ecosystem integration. AI Automation Example: Bridges e-commerce and warehouse by sending an automated 'Serial Number Tracking' confirmation to the client once equipment is picked and packed.", icon: Box },
  { name: "Order Desk", description: "Powerful order management hub that connects and routes orders across multiple fulfillment channels and vendors. AI Automation Example: Uses Phaos AI to intelligently route order data to different print facilities based on customer proximity and real-time machine availability.", icon: Layers },
  { name: "Brightpearl", description: "Retail operations platform combining inventory, accounting, CRM, and fulfillment for omnichannel commerce. AI Automation Example: Deploys a Phaos AI 'Customer Lifetime Value' alert when a buyer's total spend crosses a threshold qualifying them for a managed account.", icon: BarChart3 },
  { name: "SkuVault", description: "Warehouse management system with barcode scanning, quality control, and real-time inventory synchronization. AI Automation Example: Initiates an AI 'Inventory Audit' sequence when a stock-out occurs, automatically searching for alternative suppliers or comparable substitutes.", icon: Package },
  { name: "Linnworks", description: "Multi-channel commerce platform automating listings, inventory, and fulfillment across all major marketplaces. AI Automation Example: Triggers a Phaos AI 'Marketplace Parity' check when a price change is made, ensuring all connected sales channels remain synced and competitive.", icon: Globe },
  { name: "Liftoff (Promo Industry)", description: "Company store and promotional product platform for branded merchandise programs and corporate fulfillment. AI Automation Example: Automatically triggers a Phaos AI 'Store Maintenance' alert when a core product goes out of stock, suggesting a replacement variant to the admin.", icon: ShoppingCart },
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
