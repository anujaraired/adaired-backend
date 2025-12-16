# Backend API Documentation

## 1. Overview
This document provides a comprehensive analysis of the subject system's architecture, file structure, and core functionalities.
The system constitutes a comprehensive Node.js, Express.js, and TypeScript backend, engineered to power a robust e-commerce and content management platform. It features a modular, service-oriented architecture wherein concerns are rigorously separated, thereby facilitating scalability and maintainability.


### Core Functionalities
- **Authentication & Authorization**: Implementation of secure user registration, login (JWT-based), and a sophisticated Role-Based Access Control (RBAC) system with granular permissions.
- **E-commerce Engine**: Full lifecycle management for products, categories, shopping carts, orders, coupons, and invoices.
- **Content Management (CMS)**: A complete subsystem for the administration of blogs, blog categories, case studies, and case study categories.
- **Support & CRM**: An integrated support ticket system complemented by a dynamic form-generation utility.
- **Lead Generation**: Functionality for capturing abandoned cart data, designated as "junk leads," for subsequent marketing initiatives.
- **File Handling**: Integration with the Cloudinary platform via Multer for the efficient processing and storage of image and file uploads.
- **Scheduled Tasks**: Utilization of cron jobs for the execution of automated tasks, including the publication of scheduled blog entries and the pruning of abandoned cart records.
- **Real-time Communication**:A WebSocket service is provided for potential real-time event-driven notifications or chat functionalities.

## 2. Technological Substrate
- **Runtime**:  Node.js - The JavaScript runtime environment.
- **Framework**: Express.js (inferred) - A minimal and flexible Node.js web application framework.
- **Language**: TypeScript - A strongly typed superset of JavaScript that transpiles to plain JavaScript.
- **Database**: MongoDB (inferred) - A NoSQL document-oriented database.
- **ODM**: Mongoose (inferred) - An Object Data Modeling (ODM) library for MongoDB and Node.js.
- **Authentication**: JSON Web Tokens (JWT) (inferred) - A compact, URL-safe standard for representing claims to be transferred between two parties.
- **File Uploads**: Multer & Cloudinary (inferred) - Multer for processing multipart/form-data, and Cloudinary for cloud-based media asset management.
- **Emailing**: Nodemailer (inferred from utils/mailer.ts) - A module for Node.js applications to facilitate email transmission.
- **View Engine**: EJS (for email templates or simple views) - A templating language utilized for generating HTML markup with plain JavaScript.

## 3. Architectural Schema
This project adheres to a feature-based modular structure, wherein all related logic (controllers, routes, models, types) is co-located and organized.

```
.
├── src/
│   ├── controllers/
│   ├── cron-jobs/
│   ├── database/
│   ├── helpers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── static/
│   ├── types/
│   ├── utils/
│   ├── views/
│   └── index.ts
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── pnpm-lock.yaml
└── tsconfig.json
```

## 4. Comprehensive File Manifest and Explication
This section provides a detailed breakdown of each file and its designated purpose within the application.

### src/controllers
This directory encapsulates the business logic requisite for request processing. Controllers are responsible for handling incoming requests, interfacing with data models, and formulating responses.

- `auth.controller.ts`: Responsible for the management of all authentication protocols. Includes functions for user registration (signUp), login (signIn), password reset initiation, new password confirmation, and token validation.
- `blog-category.controller.ts`: Manages CRUD (Create, Read, Update, Delete) operations for blog post categories.
- `blog.controller.ts`: Facilitates the administration of blog post entities. Includes functions for creating, modifying, deleting, and retrieving blog posts (e.g., all posts, single post by ID/slug, posts by category).
- `cart.controller.ts`: Governs the logic pertinent to the electronic shopping cart. Includes functions for item addition, item removal, quantity modification, and retrieval of cart data for authenticated or guest users.
- `case-study-category.controller.ts`: Manages CRUD operations for case study categories, analogous to blog-category.controller.ts.
- `case-study.controller.ts`: Administers case study entities, including their creation, modification, deletion, and retrieval.
- `coupon.controller.ts`: Manages discount coupons. Encompasses logic for coupon creation, validation, and application to a cart.
- `field.controller.ts`: A component of the dynamic form-building utility. Manages the discrete fields (e.g., text input, dropdown) that constitute a form.
- `form.controller.ts`: Manages the dynamic form entities themselves. Permits administrators to define forms (e.g., "Contact Us") and processes user submissions for said forms.
- `invoice.controller.ts`: Manages the generation and retrieval of invoices. It is posited that this controller creates a new invoice document subsequent to a successful order, permitting users to access historical invoice data.
- `junkCartLeadsController.ts`: A CRM-related feature. This controller is presumed to handle the logic for capturing and viewing "junk leads"—defined as carts abandoned by users.
- `order.controller.ts`: Manages the e-commerce order fulfillment process. It handles order creation (from a cart), integration with payment gateways, order status updates, and retrieval of user order histories.
- `permission-module.controller.ts`: Manages permissions for the Role-Based Access Control (RBAC) system, allowing administrators to define permissible actions (e.g., can-create-product).
- `product-category.controller.ts`: Manages CRUD operations for e-commerce product categories.
- `product.controller.ts`: Administers e-commerce product entities. Includes functions for creating, modifying, deleting, and retrieving products (e.g., all products, by ID, by category, search).
- `role.controller.ts`: Manages user roles (e.g., "Admin", "User", "Editor"). Allows for the creation of roles and the assignment of specific permissions (from permission-module) thereto.
- `service.controller.ts`: Manages "services" if the business model includes the sale of services. Handles CRUD operations for service listings.
- `static-pages-seo.controller.ts`: Manages SEO metadata (meta title, meta description, keywords) for static, non-database-driven pages (e.g., "About Us", "Homepage").
- `ticket.controller.ts`: Administers the support ticket system. Permits users to create tickets, and administrators to view, assign, and respond to them.
- `user.controller.ts`: Manages user data. Handles operations such as profile retrieval, information updates (name, address), and administrator-level user management (e.g., deletion, role modification).

### src/cron-jobs
Encompasses scheduled, automated procedures.
- `empty-cart.ts`: A scheduled job that executes periodically (e.g., daily) to identify and delete superannuated, abandoned carts from the cartModel collection, ensuring database hygiene.
- `post-scheduled-blog.ts`: A job that executes at intervals (e.g., every minute or hour) to query the blog.model.ts collection for entries with a publishDate in the past and a "scheduled" status, thereupon updating their status to "published."

### src/database
- `connectDB.ts`: Exports a singular function that utilizes Mongoose to establish connectivity with the MongoDB database, using the connection string specified in the .env file. This function is invoked once in index.ts upon application initialization.

### src/helpers
Comprises ancillary functions specific to a particular operational domain, as distinct from the global utilities in src/utils.
- `authHelper.ts`: Contains functions utilized by auth.controller.ts, such as password hashing (via bcrypt), password comparison, and the generation/verification of JSON Web Tokens (JWTs).
- `generateGuestId.ts`: A utility for creating a unique identifier for unauthenticated users, enabling persistent guest shopping carts.
- `ticketHelper.ts`: May contain functions for the support ticket system, such as the generation of a unique ticket reference number.
- `validator.ts`: (Inferred) Likely contains request validation logic, possibly employing a library such as zod or joi, to validate request bodies prior to processing by controllers.

### src/middlewares
Represents functions executed during the request-response lifecycle.
- `authMiddleware.ts`: Secures routes by validating the JWT present in request headers. Upon successful verification, it attaches the decoded user payload (e.g., userId, role) to the Request object for subsequent use.
- `error.ts`: A global error-handling middleware. All errors propagated via next(err) are channeled to this function, which formats a consistent JSON error response for the client.
- `multerMiddleware.ts`: Configures multer for file uploads. It specifies file size limitations, file type filters, and the storage engine (e.g., memory storage for translocation to Cloudinary).
- `roleMiddleware.ts`: An authorization middleware that operates subsequent to authMiddleware. It verifies if the authenticated user's role possesses the necessary permissions to access a specific endpoint.
- `socketAuthMiddleware.ts`: Analogous to authMiddleware but adapted for WebSocket connections. It authenticates a user upon their initial connection attempt to the WebSocket server.

### src/models
Delineates the Mongoose schemata and models, which constitute the data structure definitions for the MongoDB database.
- `blog-category.model.ts`: Schema for blog categories (e.g., name, slug).
- `blog.model.ts`: Schema for blog posts (e.g., title, content, author, category, status, publishDate, metaDescription).
- `cartModel.ts`: Schema for shopping carts (e.g., userId or guestId, items: [ { productId, quantity } ], total).
- `case-study-category.model.ts`: Schema for case study categories.
- `case-study.model.ts`: Schema for case studies (e.g., title, content, industry).
- `coupon.model.ts`: Schema for coupons (e.g., code, discountType, value, expiryDate).
- `field.model.ts`: Schema for a single field in the dynamic form builder (e.g., formId, label, fieldType, options).
- `form.model.ts`: Schema for a dynamic form (e.g., formName) and its associated submissions.
- `invoice.model.ts`: Schema for invoices (e.g., orderId, userId, amount, status, invoiceUrl).
- `junkCartLeadsModel.ts`: Schema for storing data related to abandoned carts (e.g., email, cartItems, dateCaptured).
- `orderModel.ts`: Schema for completed orders (e.g., userId, items, shippingAddress, totalAmount, paymentStatus, orderStatus).
- `permission-modules.model.ts`: Schema for a permission (e.g., name: 'product-management', actions: ['create', 'read', 'update', 'delete']).
- `product-category.model.ts`: Schema for product categories (e.g., name, slug, parentCategory).
- `product.model.ts`: Schema for products (e.g., name, description, price, stock, images, category).
- `role.model.ts`: Schema for a user role (e.g., name: 'Admin', permissions: [PermissionModuleID]).
- `seo-schema.model.ts`: A generic schema for SEO metadata, ostensibly embedded within other models.
- `serviceModel.ts`: Schema for a service listing.
- `static-pages-seo.model.ts`: Schema for storing SEO data for non-model-based pages (e.g., pageName: 'About', title, description).
- `ticket.model.ts`: Schema for a support ticket (e.g., userId, subject, description, status, assignedTo, replies: []).
- `user.model.ts`: Schema for a user (e.g., firstName, lastName, email, password (hashed), role: RoleID, address).

### src/routes
Delineates the Application Programming Interface endpoints (URIs) and effectuates their mapping to the corresponding controller functions. This layer also applies middlewares, such as authMiddleware, for endpoint security.

- Each file (e.g., auth.routes.ts, product.routes.ts) instantiates an express.Router() and exports it for mounting within index.ts.
- Example (product.routes.ts):
  - router.get('/', productController.getAllProducts)
  - router.post('/', authMiddleware, roleMiddleware('Admin'), productController.createProduct)


### src/scripts
Contains scripts intended for singular, manual execution from the command line, typically for database initialization or data migration.

- `seedRoles.ts`: A script designed to populate the roles and permission-modules collections with initial data during the application's first-time setup.

### src/services
Designated for complex, reusable business logic that is decoupled from individual controllers.
- `websocket.service.ts`: Initializes and manages the WebSocket (e.g., Socket.IO) server. It handles connection events, authentication (socketAuthMiddleware), room subscriptions (e.g., order-updates:userId), and the emission of real-time events.

### src/static/uploads
A server-side directory designated for the storage of user-proffered files. Note: Given the existence of cloudinary.ts, this directory might merely serve as ephemeral storage for multer prior to file translocation to Cloudinary, or it may be unused if multer-storage-cloudinary is employed.

### src/types
Contains TypeScript interfaces and type definitions, thereby enforcing type safety across the application.

- Each file (e.g., blog.types.ts, user.types.ts) defines interfaces pertinent to its corresponding model (e.g., IBlog, IBlogDocument) and for API request/response payloads. This is critical for compile-time error detection.
- mongoose.d.ts: Augments Mongoose types to enhance compatibility with TypeScript.

### src/utils
Comprises global, reusable ancillary functions not coupled to any specific business domain.
- `cloudinary.ts`: A service wrapper for the Cloudinary API. Exports functions such as uploadImage(file) and deleteImage(publicId) to abstract the Cloudinary SDK interactions.
- `formatDate.ts`:  A utility function for formatting Date objects into a standardized, human-readable string representation.
- `globals.ts`: Defines global constants or enumerations utilized throughout the application (e.g., EMAIL_TEMPLATES, USER_ROLES).
- `mailer.ts`: A wrapper for nodemailer. Exports a sendEmail function that accepts a template identifier, recipient, and subject, populates an EJS template from src/views, and dispatches the email.
- `validateInput.ts`: (Potentially synonymous with src/helpers/validator.ts) Contains functions or schemata for data validation.

### src/views
Contains EJS (Embedded JavaScript) templates, utilized predominantly for the server-side rendering of HTML for emails.
- `index.ejs`: A master layout.
- `components/footer.ejs`:  A partial template for the email footer, intended for inclusion in other email templates.

### src/index.ts
Constitutes the principal entry point for the application. Its responsibilities include:
- Loading environment variables from the .env file.
- Initializing the Express application (const app = express()).
- Establishing the MongoDB connection via connectDB().
- Applying global middlewares (e.g., cors(), express.json()).
- Mounting all routers from src/routes under a unified base path (e.g., /api/v1).
- Applying the global error middleware subsequent to all route definitions.
- Initiating the HTTP server (app.listen()).
- Initializing the websocket.service with the instantiated HTTP server.

### Root Files
- `.env`: Environment variables (not version-controlled).
- `.gitignore`: Files/directories to ignore in Git.
- `package.json`: Project metadata, dependencies, scripts.
- `package-lock.json`: Exact dependency versions (npm).
- `pnpm-lock.yaml`: Exact dependency versions (pnpm).
- `tsconfig.json`: TypeScript compiler configuration.
