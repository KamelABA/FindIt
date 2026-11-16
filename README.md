# FindIt

FindIt – Lost it? Find it!

A university Lost & Found web platform designed to help students report lost items, publish found belongings, search for missing objects, and reconnect items with their rightful owners.

## Project Overview

FindIt is a collaborative project created for university use, with a strong focus on helping students recover personal belongings quickly and efficiently. The platform connects people who have lost an item with those who have found it, while giving administrators the tools to review, moderate, and manage reports.

## Objectives

- Simplify the process of reporting lost and found items.
- Help users quickly identify and recover their belongings.
- Provide a structured and searchable catalog of missing and recovered items.
- Support university students with a secure and user-friendly platform.
- Enable administrators to monitor item activity and manage claims.
- Design a practical foundation for future expansion and feature development.

## Main Features

- Lost item reporting.
- Found item reporting.
- Item search and filtering.
- Item details view.
- Student registration and login.
- Admin dashboard.
- Publication moderation.
- Claims management.
- Automatic item expiration after 30 days (planned).

## Lost & Found Categories

The platform will support the following item categories:

- Electronics
- Personal Items
- Documents
- Clothing
- University Items
- Accessories
- Other

## Technology Stack

Technology stack is currently TBD and will be selected as the project requirements are clarified.

Planned areas may include:

- Frontend framework: TBD
- Backend framework: TBD
- Database: TBD
- Authentication: TBD
- Hosting and deployment: TBD

## Project Architecture

The project will be organized into the following high-level layers:

- Frontend: User-facing interface for browsing, reporting, and managing items.
- Backend: API layer for authentication, item management, moderation, and claims.
- Database: Storage for users, lost/found items, claims, and admin operations.
- Documentation: Project overview, team roles, and contribution guidelines.

## Repository Structure

```text
FindIt/
├── frontend/
│   ├── public/
│   └── src/
├── backend/
│   └── src/
├── docs/
│   ├── project-overview.md
│   ├── team-roles.md
│   └── git-workflow.md
├── assets/
├── .gitignore
├── README.md
└── LICENSE
```

Note: The project is currently in its initial repository setup phase. The final framework and stack will be defined later.

## Team Members and Responsibilities

| Member | Responsibility | Branch |
|---|---|---|
| Kamel | Admin Dashboard | `feature/admin-dashboard` |
| Ridha | Home Page & Item Details | `feature/home-items` |
| Chaima | Find Page & Found Form | `feature/found-form` |
| Asma | Lost Page & Lost Form | `feature/lost-form` |
| Rafika | Register & Login | `feature/authentication` |

## Git Branching Strategy

The repository follows a simple and structured Git flow:

```text
main
  |
  └── dev
       |
       ├── feature/admin-dashboard
       ├── feature/home-items
       ├── feature/found-form
       ├── feature/lost-form
       └── feature/authentication
```

### Branch Purpose

- `main`: Stable production-ready branch.
- `dev`: Main integration branch for active development.
- Feature branches: Each developer works on assigned work independently and merges into `dev` through pull requests.

## Installation Instructions

Installation steps are placeholders until the final stack is selected.

```bash
# Clone the repository
git clone https://github.com/KamelABA/FindIt.git

# Navigate to the project directory
cd FindIt

# Checkout the relevant branch
git checkout dev
```

Additional setup commands will be added once the chosen frontend/backend stack is finalized.

## Contribution Guidelines

- Work only on your assigned feature branch.
- Keep commits small, clear, and meaningful.
- Write readable commit messages following the project convention.
- Push regularly to your remote feature branch.
- Open a pull request against `dev` when your work is ready.
- Await review before merging.
- Do not push directly to `main`.

## Development Workflow

1. Clone the repository.
2. Switch to the assigned feature branch.
3. Implement the assigned feature.
4. Commit changes regularly.
5. Push changes to the remote branch.
6. Open a Pull Request targeting `dev`.
7. Wait for code review.
8. Merge only after approval.
9. Only stable and tested work should eventually move from `dev` to `main`.

## Future Improvements

- Add automated item expiration after 30 days.
- Improve search and filtering for lost and found records.
- Add notification and claim tracking features.
- Strengthen moderation and admin controls.
- Improve user experience and mobile responsiveness.
- Add analytics and reporting dashboards.

## Commit Message Convention

Use concise and descriptive commit messages such as:

- `feat: add admin dashboard layout`
- `fix: correct item claim status logic`
- `docs: update project README`
- `refactor: simplify item search components`

## License Information

License is TBD. No license file has been added yet.

## Notes

This repository is intentionally initialized as a clean starting point for the project team. The application logic and dependencies are not implemented yet, and the project remains ready for the five developers to begin their assigned tasks.

---

This project is currently being prepared for team development and collaboration under the `main` / `dev` / feature-branch workflow.
