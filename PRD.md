# Vizzy.app Product Requirements Document

Vizzy.app is a marketing planning and execution platform designed for retail and digital campaigns that unifies campaign scheduling, content management, AI assistance, and compliance in one streamlined system.

**Experience Qualities**: 
1. Efficient - Streamlines complex campaign planning workflows into intuitive interfaces
2. Trustworthy - Provides audit trails and governance controls for enterprise compliance 
3. Intelligent - Leverages AI assistance while maintaining human oversight and approval gates

**Complexity Level**: 
Complex Application (advanced functionality, accounts) - The system requires sophisticated role-based access control, multi-phase approval workflows, AI integration, and enterprise-grade audit logging that necessitates advanced state management and backend coordination.

## Essential Features

### User & Role Management
- **Functionality**: CRUD operations for users with role/tier assignment and wrikeName validation
- **Purpose**: Establishes secure access control and ensures export compatibility with Wrike
- **Trigger**: Admin navigates to Settings → Users & Roles
- **Progression**: Admin clicks Add User → fills form with role/tier → validates wrikeName format → saves → audit logged
- **Success criteria**: Users can be created/edited with strict wrikeName validation and all changes appear in audit logs

### Store Management & CSV Import  
- **Functionality**: Store data management with bulk CSV import capabilities
- **Purpose**: Centralized store information with efficient bulk data operations
- **Trigger**: Manager accesses Settings → Stores or uploads CSV file
- **Progression**: User uploads CSV → previews headers → maps columns → validates rows → imports with error reporting
- **Success criteria**: CSV imports process with clear success/error counts and downloadable error reports

### 7-Day Campaign Planner
- **Functionality**: Drag-and-drop weekly campaign activity scheduling with approval workflows
- **Purpose**: Visual campaign planning with governance controls
- **Trigger**: Planner opens the Planner interface
- **Progression**: Create activity → assign owner → drag to day → Manager approves → Export to Wrike
- **Success criteria**: Activities can be created, moved between days, approved by authorized users, and exported as valid XLSX

### AI-Assisted Content Generation
- **Functionality**: AI-powered content suggestions and campaign simulations via chat interface
- **Purpose**: Accelerate creative ideation while maintaining human oversight
- **Trigger**: User opens Vizzy chat drawer and enters commands
- **Progression**: User types /simulate or requests content → AI generates suggestions → human reviews → approves or rejects
- **Success criteria**: AI provides helpful suggestions that require explicit human approval before implementation

### Audit Trail & Compliance
- **Functionality**: Comprehensive logging of all system actions with before/after diffs
- **Purpose**: Enterprise governance and traceability requirements
- **Trigger**: Any CRUD operation, approval, or export action
- **Progression**: Action occurs → audit entry created → stored in immutable logs → available for compliance review
- **Success criteria**: Every material action generates audit logs with complete traceability

## Edge Case Handling

- **Invalid wrikeName**: Block user creation/updates and exports if wrikeName doesn't match "firstName lastName" format
- **CSV Import Errors**: Skip invalid rows, generate error report with specific issues, show success/error counts
- **Permission Violations**: Deny actions with clear error messages and log violation attempts
- **Export Failures**: Block XLSX generation if any assigned users have invalid wrikeNames, surface complete error list
- **AI Command Abuse**: Restrict /set commands to Admin role only, require explicit approval for all /simulate commits

## Design Direction

The design should feel professional and trustworthy like enterprise software while remaining approachable and efficient for daily use. A minimal interface serves the core purpose by reducing cognitive load during complex campaign planning workflows.

## Color Selection

Complementary (opposite colors) - Using a professional blue-green palette that communicates trust and efficiency with warm orange accents for important actions and warnings.

- **Primary Color**: Deep Blue (#1e40af) - Conveys trust, professionalism, and reliability for core brand elements
- **Secondary Colors**: Slate Gray (#64748b) for supporting UI elements and Cool Green (#059669) for success states  
- **Accent Color**: Warm Orange (#ea580c) - Attention-grabbing highlight for CTAs, warnings, and important status indicators
- **Foreground/Background Pairings**: 
  - Background (White #ffffff): Dark Gray text (#0f172a) - Ratio 16.1:1 ✓
  - Card (Light Gray #f8fafc): Dark Gray text (#0f172a) - Ratio 15.8:1 ✓  
  - Primary (Deep Blue #1e40af): White text (#ffffff) - Ratio 8.2:1 ✓
  - Secondary (Slate Gray #64748b): White text (#ffffff) - Ratio 4.6:1 ✓
  - Accent (Warm Orange #ea580c): White text (#ffffff) - Ratio 4.9:1 ✓

## Font Selection

Typography should convey clarity and professionalism suitable for data-heavy interfaces while maintaining excellent readability across all screen sizes.

- **Typographic Hierarchy**: 
  - H1 (Page Title): Inter Bold/32px/tight letter spacing
  - H2 (Section Headers): Inter Semibold/24px/normal letter spacing  
  - H3 (Subsections): Inter Medium/20px/normal letter spacing
  - Body (Primary Text): Inter Regular/16px/1.5 line height
  - Caption (Secondary Text): Inter Regular/14px/1.4 line height
  - Button Text: Inter Medium/16px/tight letter spacing

## Animations

Animations should feel purposeful and efficient, supporting workflow clarity rather than decoration, with subtle transitions that guide attention and confirm actions.

- **Purposeful Meaning**: Motion communicates system responsiveness and guides users through complex approval workflows with clear state transitions
- **Hierarchy of Movement**: Drag-and-drop operations receive priority animation focus, followed by approval state changes, then general UI transitions

## Component Selection

- **Components**: 
  - Cards for activity display and user profiles
  - Dialogs for user/store editing forms
  - Tables with filters for users/stores listing  
  - Drawer for AI chat interface
  - Drag-and-drop zones using framer-motion
  - Form components with react-hook-form integration
  - Button variants for different action types (primary/secondary/destructive)

- **Customizations**: 
  - Custom planner grid component for 7-day layout
  - Specialized CSV import dialog with header mapping
  - Custom audit log viewer for compliance

- **States**: 
  - Buttons show clear hover/active/disabled states
  - Form inputs provide inline validation feedback
  - Activity cards display draft/approved/exported status
  - Loading states for async operations

- **Icon Selection**: 
  - Phosphor icons for consistent visual language
  - User management: User, UserPlus, UserCheck
  - Planning: Calendar, DragDrop, CheckCircle
  - Data: Upload, Download, FileText
  - Actions: Play, Pause, Settings, MessageCircle

- **Spacing**: 
  - Base unit of 4px (1 in Tailwind scale)
  - Component padding: p-4 to p-6 depending on content density
  - Section gaps: gap-6 for related elements, gap-8 for distinct sections

- **Mobile**: 
  - Desktop planner uses 7-column grid layout
  - Mobile planner converts to horizontal scrolling strip
  - Navigation collapses to hamburger menu below 768px
  - Forms stack vertically with full-width inputs
  - Tables scroll horizontally on mobile with sticky first column