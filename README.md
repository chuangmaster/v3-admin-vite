<div align="center">
  <img alt="logo" width="120" height="120" src="./src/common/assets/images/layouts/logo.png">
  <h1>V3 Admin Vite - Rapid Admin System Setup</h1>
</div>

<b>English | <a href="./README.zh-CN.md">中文</a></b>

## Introduction

This project is a customized version based on [V3 Admin Vite](https://github.com/un-pany/v3-admin-vite), focusing on providing a **ready-to-use frontend-backend admin system solution**. By integrating complete business modules with standardized API contracts, it enables rapid backend integration and quick deployment.

### Key Features

✨ **Complete Business Modules**: Built-in user management, role management, permission management, and other core admin features
🔗 **Backend Contract Integration**: Strictly follows OpenAPI specifications for seamless backend API integration
🚀 **Quick Setup**: Clear directory structure and standardized development workflow with low learning curve
📦 **Ready to Use**: Complete CRUD examples, permission control, Excel export, and other common features
🎨 **Enterprise Quality**: Modern tech stack based on Vue 3 + TypeScript + Element Plus

## Backend Project

> [!IMPORTANT]
> **Companion Backend Project**: [V3.Admin.Backend](https://github.com/chuangmaster/V3.Admin.Backend)
>
> This frontend project is designed to work seamlessly with the companion backend. The backend project provides:
>
> - RESTful APIs following OpenAPI specification
> - JWT authentication and authorization
> - User, Role, and Permission management endpoints
> - Complete API documentation and contracts

> [!TIP]
> For the best development experience, clone and run both frontend and backend projects together. The frontend is pre-configured to connect to the backend at `http://localhost:5176`.

## Usage

<details>
<summary>Recommended Environment</summary>

<br>

- Latest version of `Visual Studio Code` or AI IDE `Cursor` and `Trae`
- Install the recommended plugins in the `.vscode/extensions.json` file
- `node` 20.19+ or 22.12+
- `pnpm` 10+

</details>

<details>
<summary>Local Development</summary>

<br>

```bash
# Clone the project
git clone https://github.com/un-pany/v3-admin-vite.git

# Enter the project directory
cd v3-admin-vite

# Install dependencies
pnpm i

# Start the development server
pnpm dev
```

</details>

<details>
<summary>Build</summary>

<br>

```bash
# Build for the staging environment
pnpm build:staging

# Build for the production environment
pnpm build
```

</details>

<details>
<summary>Local Preview</summary>

<br>

```bash
# Execute the build command first to generate the dist directory, then run the preview command
pnpm preview
```

</details>

<details>
<summary>Code Check</summary>

<br>

```bash
# Code linting and formatting
pnpm lint

# Unit tests
pnpm test
```

</details>

<details>
<summary>Commit Guidelines</summary>

<br>

`feat` New feature

`fix` Bug fix

`perf` Performance improvement

`refactor` Code refactoring

`docs` Documentation and comments

`types` Type-related changes

`test` Unit tests related

`ci` Continuous integration, workflows

`revert` Revert changes

`chore` Chores (update dependencies, modify configurations, etc)

</details>

## Project Features

### 📦 Built-in Business Modules

This project has integrated complete core admin management features:

#### 1. User Management Module

- ✅ User list query (pagination, search, filter)
- ✅ Add user (password strength validation, role assignment)
- ✅ Edit user information
- ✅ Delete user (soft delete mechanism)
- ✅ Export Excel report
- ✅ Complete permission control (route-level + button-level)
- ✅ Password change functionality

#### 2. Role Management Module

- ✅ Role list query
- ✅ Create/edit/delete roles
- ✅ Role permission assignment
- ✅ Concurrent update conflict handling
- ✅ Role usage status check

#### 3. Permission Management Module

- ✅ Permission list query
- ✅ Create/edit/delete permissions
- ✅ Permission code format validation
- ✅ Permission usage status check
- ✅ Hierarchical permission structure

### 🔗 Standardized API Integration

- **OpenAPI Specification Compliance**: All API calls strictly follow backend OpenAPI specification
- **Unified Response Format**: `ApiResponse<T>` standardized response structure (success, code, message, data, timestamp, traceId)
- **Complete Error Handling**: Covers validation errors, authorization errors, concurrent conflicts, and other business logic error codes
- **JWT Authentication**: Automatically carries Bearer Token, unified handling of unauthorized situations
- **API Contract Documents**: Detailed API contract documents for each module

### 🎯 Development Standardization

- **Clear Directory Structure**: Organized by business modules, separation of public and private resources
- **Type Safety**: Complete TypeScript type definitions
- **Composables**: Reusable business logic encapsulation
- **Unit Tests**: Corresponding test cases for core functionalities
- **Development Documentation**: Complete spec, quickstart, tasks for each module

## Links

- **Original Project**: [V3 Admin Vite](https://github.com/un-pany/v3-admin-vite) by [@un-pany](https://github.com/un-pany)
- **Vue 3 Documentation**: [https://vuejs.org/](https://vuejs.org/)
- **Element Plus Documentation**: [https://element-plus.org/](https://element-plus.org/)
- **Vite Documentation**: [https://vitejs.dev/](https://vitejs.dev/)

**Multiple Environments**: Development, staging, and production environments

**Multiple Themes**: Normal, dark, and deep blue themes

**Multiple Layouts**: Left-side, top, and hybrid layouts

**Homepage**: Different dashboard pages for different users

**Error Pages**: 403, 404

**Mobile Compatibility**: Layouts compatible with mobile screen resolutions

**Others**: SVG sprite sheet, dynamic sidebar, dynamic breadcrumbs, tab navigation, content zoom and fullscreen, composable functions

## Tech Stack

**Vue3**: Vue3 + script setup with the latest Vue3 Composition API

**Element Plus**: The Vue3 version of Element UI

**Pinia**: The legendary Vuex5

**Vite**: Really fast

**Vue Router**: The routing system

**TypeScript**: A superset of JavaScript

**pnpm**: A faster, disk-space-saving package manager

**Scss**: Consistent with Element Plus

**CSS Variables**: Primarily controls layout and color in the project

**ESLint**: Code linting and formatting

**Axios**: Sends network requests

**UnoCSS**: A high-performance, flexible atomic CSS engine

## Acknowledgements

This project is based on [V3 Admin Vite](https://github.com/un-pany/v3-admin-vite) for customization. Thanks to original author [@pany](https://github.com/pany-ang) and all contributors for their hard work!

## License

[MIT](./LICENSE) License

---

**Project Goal**: Provide a ready-to-use enterprise-level frontend-backend admin system solution, allowing development teams to focus on business logic rather than infrastructure setup.
