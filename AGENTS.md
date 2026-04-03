# AGENTS.md

This document provides guidance for AI agents working in this repository.

---

## Project Overview

This is a monorepo using Nx containing a DID (Decentralized Identifier) verification system with:

- **api-issuer**: NestJS backend API for issuing and managing credentials
- **admin-web**: React admin dashboard
- **mobile-wallet**: React Native mobile wallet app
- **mobile-verifier**: React Native verifier app
- **packages/did-core**: Core DID/credential cryptographic library
- **packages/ui-kit**: Shared UI component library

---

## Build/Lint/Test Commands

### Run All Commands

```bash
npx nx run-many -t lint test build
```

### Run Single Project

```bash
npx nx build <project-name>
npx nx lint <project-name>
npx nx test <project-name>
```

### Run Single Test File

```bash
npx nx test <project-name> --testFile=path/to/file.spec.ts
npx nx test did-core --testPathPattern="did-core.spec.ts"
```

### Specific Project Examples

```bash
# API Issuer (NestJS)
npx nx build api-issuer
npx nx test api-issuer
npx nx lint api-issuer
npx nx serve api-issuer

# DID Core Library
npx nx build did-core
npx nx test did-core

# Mobile Wallet
npx nx build mobile-wallet
npx nx start mobile-wallet
npx nx run-ios mobile-wallet
npx nx run-android mobile-wallet

# React Admin Web
npx nx build admin-web
npx nx serve admin-web
```

### Dev Server

```bash
npm run dev           # Start api-issuer and admin-web
npm run db:up         # Start Docker database
npm run db:down       # Stop Docker database
```

---

## Code Style Guidelines

### TypeScript Configuration

- Target: ES2020
- Module: esnext
- Decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`)
- Path aliases configured in `tsconfig.base.json`:
  - `@secure-verify/did-core` → `packages/did-core/src/index.ts`
  - `@secure-verify/did-core/merkle` → `packages/did-core/src/lib/merkle.ts`
  - `@secure-verify/ui-kit` → `packages/ui-kit/src/index.ts`

### Linting

- ESLint with flat config (`eslint.config.mjs`)
- Uses `@nx/eslint-plugin` for module boundary enforcement
- Prettier formatting with single quotes

### Prettier

```json
{
  "singleQuote": true
}
```

### Import Organization

1. External packages (e.g., `@nestjs/common`, `ethers`)
2. Internal packages (e.g., `@secure-verify/did-core`)
3. Relative imports (e.g., `./entities`, `../services`)

```typescript
// Good import order
import { Controller, Get, Post } from '@nestjs/common';
import { KeyManager, Signer, Verifier } from '@secure-verify/did-core';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
```

### Naming Conventions

| Type                | Convention                                             | Example                                     |
| ------------------- | ------------------------------------------------------ | ------------------------------------------- |
| Classes             | PascalCase                                             | `KeyManager`, `StudentService`              |
| Variables/Functions | camelCase                                              | `generateWallet`, `studentId`               |
| Constants           | PascalCase (classes) or SCREAMING_SNAKE (module-level) | `EC_N`, `StudentStatus.ACTIVE`              |
| Files               | kebab-case                                             | `student.service.ts`, `auth.module.ts`      |
| React Components    | PascalCase (file and export)                           | `App.tsx`, `UiKit.tsx`                      |
| Test Files          | Same as source + `.spec.ts`                            | `app.service.spec.ts`                       |
| Entity Files        | Singular noun                                          | `student.entity.ts`, `credential.entity.ts` |
| DTO Files           | Verb + noun                                            | `create-student.dto.ts`                     |
| Decorator files     | kebab-case                                             | `public.decorator.ts`, `Jwt-auth.guard.ts`  |

### Error Handling

- Use typed exceptions (`UnauthorizedException`, `BadRequestException`)
- Always catch async errors in try/catch blocks
- Return structured error responses when needed

```typescript
// NestJS - throw built-in exceptions
throw new UnauthorizedException('Invalid credentials');

// TypeScript - use try/catch for async operations
try {
  const result = await someAsyncOperation();
  return result;
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  return { isValid: false, error: message };
}
```

### Type Annotations

- Always use explicit return types for public methods/functions
- Use interfaces for DTOs and data structures
- Prefer `type` for unions/intersections, `interface` for objects

```typescript
// Good - explicit return types
getData(): { message: string } { ... }
async signIn(email: string, pass: string): Promise<{ access_token: string }> { ... }

// Good - typed DTOs
export class CreateStudentDto {
    @IsString()
    @IsNotEmpty()
    rollNumber: string;
}
```

### NestJS Patterns

- Use constructor injection for dependencies
- Apply `@Injectable()` decorator to all services
- Use decorators for metadata (`@Public()`, `@Controller()`, `@Get()`)
- Use TypeORM decorators for entities (`@Entity()`, `@Column()`, `@PrimaryGeneratedColumn()`)

```typescript
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
  ) {}
}
```

### React Native Patterns

- Use functional components with hooks
- Import React explicitly when needed
- Use `StyleSheet.create()` for component styles
- Test components with `@testing-library/react-native`

```typescript
import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';

export const App = () => {
    const [count, setCount] = useState<number>(0);
    return <View style={styles.container}><Text>Count: {count}</Text></View>;
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
});
```

### Module Boundaries

- Libraries under `packages/` are shared
- Apps under `apps/` are deployable applications
- Enforce module boundaries via `@nx/enforce-module-boundaries`
- Use path aliases for internal packages

### Testing Conventions

- Test files: `*.spec.ts` or `*.spec.tsx`
- Use `describe` blocks for test suites
- Use `it` or `test` for individual test cases
- NestJS: use `@nestjs/testing` module helpers
- React Native: use `@testing-library/react-native`

```typescript
// NestJS service test
describe('AppService', () => {
  let service: AppService;
  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();
    service = app.get<AppService>(AppService);
  });
  it('should return "Hello API"', () => {
    expect(service.getData()).toEqual({ message: 'Hello API' });
  });
});
```

---

## Key Dependencies

### Backend

- NestJS 11.x
- TypeORM with PostgreSQL
- Passport JWT authentication
- bcrypt for password hashing

### Mobile

- React Native 0.81.x
- Expo SDK 54
- React Navigation 7.x
- ethers.js for crypto

### Shared

- ethers.js 6.x
- TypeScript 5.9.x
- Jest 30.x
- Nx 22.x

---

## File Structure Reference

```
apps/
├── api-issuer/          # NestJS API (port typically 3000)
│   └── src/app/
│       ├── auth/        # Authentication (guards, decorators, services)
│       ├── entities/    # TypeORM entities
│       ├── dto/         # Data transfer objects
│       └── [features]/  # Feature modules (students, merkle, setup)
├── admin-web/           # React admin dashboard
mobile-wallet/          # React Native wallet app
mobile-verifier/        # React Native verifier app
packages/
├── did-core/            # DID/credential cryptographic library
│   └── src/lib/
│       ├── crypto.ts    # KeyManager, Signer, Verifier classes
│       ├── did.ts       # DIDGenerator class
│       └── merkle.ts    # Merkle tree operations
└── ui-kit/              # Shared UI components
```
