# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Deployment
```bash
vercel --prod        # Deploy to production
vercel logs          # View deployment logs
git push             # Triggers automatic Vercel deployment
```

## Architecture Overview

### Core System Design

This is a **Next.js 14 TypeScript** application that implements a **decentralized AI-powered counseling automation system** for Korean educators. The key architectural principle is **individual user API key management** - each user provides their own Gemini API key, stored encrypted in their personal Google Drive.

### Authentication & Data Flow
- **NextAuth.js** with Google OAuth provides authentication
- **Google Drive API** stores user-specific configurations (encrypted Gemini API keys)
- **Google Sheets API** manages student data and survey results
- **Gemini AI API** generates personalized SEL (Social-Emotional Learning) surveys
- **Token refresh mechanism** handles OAuth token expiration automatically

### API Architecture

The system uses Next.js 14 App Router with these critical API endpoints:

#### User Management APIs
- `/api/user/settings` - Save/retrieve encrypted Gemini API keys to/from Google Drive
- `/api/user/initialize` - Create initial Google Drive folder structure and spreadsheets
- `/api/user/validate-api` - Validate Gemini API key functionality

#### Survey APIs  
- `/api/surveys/generate` - Generate SEL surveys using user's Gemini API key
- `/api/surveys/analyze` - Analyze survey responses for SEL scoring

#### Authentication
- `/api/auth/[...nextauth]` - NextAuth.js OAuth flow with Google

### Key Libraries Integration

#### Google APIs Integration (`/lib/googleDrive.ts`, `/lib/googleSheets.ts`)
- **Google Drive Client**: Manages user configuration files, folder structure
- **Google Sheets Client**: Handles student data, survey results, SEL analysis
- **Token Management**: Automatic refresh of expired OAuth tokens

#### AI Integration (`/lib/gemini.ts`)
- **GeminiClient**: Generates SEL questions based on student grade, focus areas, difficulty
- **User-Specific Keys**: Each user's API key retrieved from encrypted Google Drive storage
- **SEL Categories**: 5 core areas (selfAwareness, selfManagement, socialAwareness, relationship, decisionMaking)

#### Authentication (`/lib/auth.ts`)
- **Comprehensive OAuth Scopes**: Drive, Forms, Sheets API access
- **Token Refresh Logic**: Handles expired tokens automatically
- **Session Management**: Extends JWT tokens with Google access tokens

### Component Architecture

#### Survey System (`/components/surveys/`)
- **SurveyGenerator**: Main UI for creating SEL surveys
- **Grade Selection**: Elementary through high school targeting
- **Focus Areas**: Checkboxes for 5 SEL categories
- **Difficulty Levels**: Basic, Standard, Advanced

#### Charts (`/components/charts/`)
- **SELChart**: Radar chart visualization using Recharts
- **Color System**: Consistent 5-color palette for SEL categories

#### UI Components (`/components/ui/`)
- **Button**: Consistent styling with Tailwind variants
- **Card**: Layout container with header/content structure  
- **StudentCard**: Displays student SEL scores with crisis level indicators

### Data Models

#### SEL Question Structure
```typescript
interface SelQuestion {
  category: 'selfAwareness' | 'selfManagement' | 'socialAwareness' | 'relationship' | 'decisionMaking'
  question: string
  options: string[]
  weight: number
}
```

#### Survey Configuration
```typescript
interface SurveyConfig {
  targetGrade: string
  studentName?: string
  focusAreas?: string[]
  difficultyLevel: 'basic' | 'standard' | 'advanced'
}
```

### Error Handling Patterns

The codebase uses TypeScript strict mode with comprehensive error handling:

```typescript
// Type guards for error handling
const error = stepError instanceof Error ? stepError : new Error(String(stepError))

// Comprehensive logging for debugging
console.log('API 단계:', { hasSession: !!session, hasAccessToken: !!session?.accessToken })
```

### Security Architecture

- **Encrypted Storage**: Gemini API keys encrypted with Base64 before Google Drive storage
- **Individual Isolation**: Each user's data stored in their personal Google Drive
- **OAuth Scopes**: Minimal required permissions (drive.file, forms, spreadsheets)
- **Token Refresh**: Automatic handling of expired OAuth tokens

### Korean Education Context

The system is specifically designed for Korean educators with:
- **Korean Language UI**: All interfaces in Korean
- **Korean Education System**: Grade levels (초등/중학/고등학교)
- **SEL Framework**: Social-Emotional Learning adapted for Korean context
- **Crisis Level System**: 4-tier alert system (정상/관심/주의/위험)

### Environment Configuration

Required environment variables:
```
NEXTAUTH_URL=https://counselingautomation.vercel.app
NEXTAUTH_SECRET=[random-string]
GOOGLE_CLIENT_ID=[oauth-client-id]
GOOGLE_CLIENT_SECRET=[oauth-client-secret]
```

### Deployment Context

- **Platform**: Vercel with automatic deployments
- **Production URL**: https://counselingautomation.vercel.app
- **Google OAuth Redirect**: Must match production URL exactly
- **Build Process**: TypeScript strict mode compilation

### Common Issues & Solutions

#### Google Drive API Forbidden Errors
- Check OAuth token expiration and refresh mechanism
- Verify Google Drive API is enabled in Google Cloud Console
- Ensure proper scopes in NextAuth configuration

#### Survey Generation Failures
- Validate Gemini API key is properly encrypted/decrypted
- Check user has completed initialization process
- Verify Google Drive folder structure exists

#### TypeScript Build Errors
- Use type guards for error handling: `error instanceof Error`
- Ensure proper typing for API responses
- Handle both Error objects and string errors in catch blocks