<<<<<<< HEAD
# Vizzy v4

AI-powered campaign management platform with governance and audit capabilities.

## 🏗️ Architecture

### Frontend
- **React 18** + **Vite** + **TypeScript** + **Tailwind CSS**
- **React Router v6** with lazy-loaded routes
- **TanStack Query** for server state management
- **Framer Motion** for animations
- **Zod** for schema validation
- Command palette with keyboard shortcuts
- Responsive sidebar navigation

### Backend
- **Firebase** (Auth, Firestore, Functions, Hosting, Storage)
- **Callable Functions** for business logic
- **Scheduled Functions** for background jobs
- **RBAC/TBAC** (Role-Based + Team-Based Access Control)
- **Immutable audit logs** with cryptographic hashing

### Observability
- **Firebase Analytics** for user behavior
- **Custom telemetry** collection in Firestore
- **Performance monitoring** with Lighthouse CI
- **Error tracking** and logging

### Testing
- **Vitest** + **React Testing Library** for unit tests
- **Playwright** for E2E testing
- **Lighthouse CI** for performance testing
- **axe-core** for accessibility testing

### CI/CD
- **GitHub Actions** with comprehensive gates
- **Automated testing** (unit, E2E, a11y, performance)
- **Security auditing** with npm audit
- **Multi-environment deployment** (dev, staging, prod)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Firebase CLI
- Git

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd vizzy-v4
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Copy example env files
   cp apps/web/.env.example apps/web/.env.local
   
   # Edit apps/web/.env.local with your Firebase config:
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_TELEMETRY_ENABLED=true
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```
   
   This starts:
   - Web app on http://localhost:3000
   - Firebase emulators on http://localhost:4000

4. **Access the application:**
   - Open http://localhost:3000
   - Use Firebase Auth Emulator to create test accounts
   - Explore the campaign planner, AI assistant, and governance features

### Available Scripts

```bash
# Development
npm run dev              # Start web app + emulators
npm run dev:web          # Start web app only
npm run dev:emulators    # Start Firebase emulators only

# Building
npm run build            # Build all workspaces
npm run preview          # Preview production build

# Testing
npm run test             # Run all tests
npm run test:unit        # Unit tests only
npm run test:e2e         # E2E tests only
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # ESLint
npm run lint:fix         # Fix linting issues
npm run typecheck        # TypeScript check
npm run a11y             # Accessibility audit

# Deployment
npm run deploy           # Deploy to default environment
npm run deploy:staging   # Deploy to staging
npm run deploy:prod      # Deploy to production
```

## 🏛️ Governance Model

### "AI Proposes, Humans Approve"

Vizzy v4 implements a strict governance model where:

1. **AI can only suggest** - AI systems generate recommendations but cannot execute actions
2. **Human approval required** - All significant actions require explicit human approval
3. **Immutable audit trails** - All actions are logged with cryptographic hashes
4. **RBAC/TBAC enforcement** - Access control is enforced at multiple levels

### Access Control

#### Roles
- **Admin**: Full system access, can approve/reject campaigns
- **Reviewer**: Can review and approve campaigns, view governance
- **Editor**: Can create and edit campaigns, request AI suggestions
- **Viewer**: Read-only access to campaigns and suggestions
- **AI-System**: Limited permissions for AI operations only

#### Teams
- **Team-Based Access Control (TBAC)**: Users can only access resources assigned to their teams
- **Cross-team collaboration**: Requires explicit permissions or admin approval

### Audit & Compliance

- **Immutable logs**: All governance actions are cryptographically hashed
- **Complete audit trails**: Track who did what, when, and why
- **Compliance reporting**: Generate reports for regulatory requirements
- **Wrike integration**: Export approved campaigns to external project management

## 📁 Project Structure

```
vizzy-v4/
├── apps/web/                    # React web application
│   ├── src/
│   │   ├── app/                 # App initialization & bootstrap
│   │   ├── routes/              # Lazy-loaded route components
│   │   ├── components/          # Reusable UI components
│   │   ├── lib/                 # Core libraries (auth, api, telemetry, rbac)
│   │   ├── schemas/             # Zod validation schemas
│   │   ├── config/              # Navigation & feature flags
│   │   └── test/                # Test files
│   ├── e2e/                     # Playwright E2E tests
│   └── public/                  # Static assets
├── functions/                   # Firebase Functions
│   ├── src/
│   │   ├── callables/           # Callable functions
│   │   ├── jobs/                # Scheduled functions
│   │   ├── lib/                 # Shared libraries
│   │   └── integrations/        # External integrations
│   └── __tests__/               # Function tests
├── firebase/                    # Firebase configuration
│   ├── firestore.rules          # Firestore security rules
│   ├── firestore.indexes.json   # Database indexes
│   ├── storage.rules            # Storage security rules
│   └── hosting.rewrites.json    # Hosting configuration
├── .github/workflows/           # CI/CD pipelines
└── docs/                        # Documentation
```

## 🔧 Configuration

### Environment Variables

#### Client (VITE_*)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_TELEMETRY_ENABLED`

#### Server (Functions config)
- `WRIKE_API_TOKEN`
- `WRIKE_PROJECT_ID`
- `SLACK_WEBHOOK_URL`
- `ENCRYPTION_KEY`

### Feature Flags

Located in `apps/web/src/config/flags.ts`:

```typescript
export const FLAGS = {
  AI_SUGGESTIONS: true,
  AI_AUTO_COMPLETE: false,
  TBAC_ENABLED: true,
  COMMAND_PALETTE: true,
  // ... more flags
};
```

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```
- **Framework**: Vitest + React Testing Library
- **Coverage**: V8 provider with HTML reports
- **Mocking**: Firebase services and external APIs

### E2E Tests
```bash
npm run e2e
```
- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Responsive testing included

### Accessibility Tests
```bash
npm run a11y
```
- **Tool**: axe-core integration
- **Standards**: WCAG 2.1 AA compliance
- **Automated**: Part of CI/CD pipeline

### Performance Tests
```bash
lighthouse http://localhost:5000
```
- **Tool**: Lighthouse CI
- **Metrics**: Performance, Accessibility, Best Practices, SEO
- **Thresholds**: 90% minimum scores

## 🚀 Deployment

### Environments

1. **Development** (`dev`)
   - Local Firebase emulators
   - Hot reload enabled
   - Mock data available

2. **Staging** (`staging`)
   - Firebase staging project
   - Production-like environment
   - Smoke tests after deployment

3. **Production** (`prod`)
   - Firebase production project
   - Full monitoring enabled
   - Automated rollback on failures

### Deployment Process

1. **Code Review**: All changes require PR approval
2. **Automated Testing**: CI runs full test suite
3. **Security Audit**: npm audit checks for vulnerabilities
4. **Performance Check**: Lighthouse CI validates performance
5. **Staging Deployment**: Auto-deploy to staging on `develop`
6. **Production Deployment**: Manual approval required for `main`

### Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init

# Set up projects
firebase use --add staging
firebase use --add production

# Deploy
firebase deploy
```

## 🔐 Security

### Authentication
- **Firebase Auth** with Google OAuth
- **Email/password** authentication
- **JWT tokens** for API access
- **Session management** with automatic refresh

### Authorization
- **RBAC**: Role-based permissions
- **TBAC**: Team-based access control
- **Resource-level**: Granular permissions
- **Audit logging**: All access attempts logged

### Data Protection
- **Firestore rules**: Server-side validation
- **Storage rules**: File access control
- **Encryption**: Data encrypted in transit and at rest
- **PII handling**: Minimal data collection (name/email only)

### Compliance
- **GDPR ready**: Data export and deletion
- **SOC 2**: Audit trails and monitoring
- **Immutable logs**: Cryptographic integrity
- **Wrike integration**: External compliance reporting

## 📊 Monitoring & Observability

### Telemetry
- **Event tracking**: User actions and system events
- **Performance metrics**: Page load times, API response times
- **Error tracking**: Automatic error capture and reporting
- **Usage analytics**: Feature adoption and user flows

### Logging
- **Structured logging**: JSON format for easy parsing
- **Log levels**: Debug, Info, Warn, Error
- **Correlation IDs**: Track requests across services
- **Retention**: Configurable log retention policies

### Alerting
- **Error rates**: Alert on high error rates
- **Performance**: Alert on slow response times
- **Security**: Alert on suspicious activity
- **Capacity**: Alert on resource usage

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes
4. **Write** tests for new functionality
5. **Run** the test suite: `npm test`
6. **Commit** your changes: `git commit -m 'Add amazing feature'`
7. **Push** to your branch: `git push origin feature/amazing-feature`
8. **Open** a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Structured commit messages
- **Test Coverage**: Minimum 80% coverage required

### Pull Request Process

1. **Tests pass**: All CI checks must be green
2. **Code review**: At least one approval required
3. **Documentation**: Update docs for new features
4. **Security review**: Security team approval for sensitive changes
5. **Merge**: Squash and merge to maintain clean history

## 📚 API Documentation

### Callable Functions

#### `validateCampaign`
Validates campaign data against governance rules.

**Parameters:**
```typescript
{
  campaignId: string;
  campaignData: Record<string, unknown>;
  validationType: 'draft' | 'preview' | 'publish';
}
```

**Returns:**
```typescript
{
  success: boolean;
  errors: string[];
  warnings: string[];
}
```

#### `submitForReview`
Submits a campaign for governance review.

**Parameters:**
```typescript
{
  campaignId: string;
  reviewType: 'content' | 'compliance' | 'strategy';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}
```

#### `approveCampaign`
Approves or rejects a campaign.

**Parameters:**
```typescript
{
  campaignId: string;
  reviewId: string;
  approvalType: 'approve' | 'reject';
  reason: string;
}
```

#### `exportToWrike`
Exports approved campaigns to Wrike.

**Parameters:**
```typescript
{
  campaignId: string;
  exportType: 'campaign' | 'tasks' | 'timeline';
  wrikeProjectId?: string;
  includeMetadata?: boolean;
}
```

#### `aiSuggest`
Generates AI-powered suggestions.

**Parameters:**
```typescript
{
  prompt: string;
  type: 'content' | 'strategy' | 'optimization' | 'audience';
  context?: {
    campaignId?: string;
    userId?: string;
    previousSuggestions?: string[];
  };
  options?: {
    maxSuggestions?: number;
    confidence?: number;
    includeExamples?: boolean;
  };
}
```

## 🆘 Troubleshooting
## Dev Firebase Toggle

- Default: MOCKS (no Firebase). See `apps/web/.env.example`.
- To use real Firebase in dev: set `VITE_USE_MOCKS=0` in `apps/web/.env.local` and fill the `VITE_FIREBASE_*` vars.
- Optional: set `VITE_USE_EMULATORS=1` to connect to local Auth/Firestore emulators.


### Common Issues

#### Firebase Connection Issues
```bash
# Check Firebase CLI
firebase --version

# Re-authenticate
firebase logout
firebase login

# Check project configuration
firebase projects:list
firebase use <project-id>
```

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run typecheck

# Check linting issues
npm run lint
```

#### Test Failures
```bash
# Run tests with verbose output
npm run test -- --reporter=verbose

# Run specific test file
npm run test -- src/test/components/Layout.test.tsx

# Debug E2E tests
npm run e2e -- --debug
```

#### Deployment Issues
```bash
# Check Firebase project status
firebase projects:list

# Verify environment variables
firebase functions:config:get

# Check deployment logs
firebase functions:log
```

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Report security issues privately to security@company.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Firebase** for the backend infrastructure
- **React** team for the amazing frontend framework
- **Tailwind CSS** for the utility-first CSS framework
- **Vite** for the fast build tool
- **Playwright** for reliable E2E testing
- **Lighthouse** for performance monitoring

---

**Built with ❤️ by the Vizzy team**
=======
# ✨ Welcome to Your Spark Template!
You've just launched your brand-new Spark Template Codespace — everything’s fired up and ready for you to explore, build, and create with Spark!

This template is your blank canvas. It comes with a minimal setup to help you get started quickly with Spark development.

🚀 What's Inside?
- A clean, minimal Spark environment
- Pre-configured for local development
- Ready to scale with your ideas
  
🧠 What Can You Do?

Right now, this is just a starting point — the perfect place to begin building and testing your Spark applications.

🧹 Just Exploring?
No problem! If you were just checking things out and don’t need to keep this code:

- Simply delete your Spark.
- Everything will be cleaned up — no traces left behind.

📄 License For Spark Template Resources 

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
>>>>>>> 21c58f78115a45d42f40dd19a8a47c7f292f2073
