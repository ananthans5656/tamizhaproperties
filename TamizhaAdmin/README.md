<<<<<<< HEAD
# 🏢 Tamizha Properties — Full-Stack Admin Dashboard

A premium real-estate admin dashboard with React frontend, NestJS backend, and PostgreSQL database.

---

## 📁 Project Structure

```
tamizha properties web main/
├── frontend/          ← React + Vite + TypeScript
└── backend/           ← NestJS + TypeORM + PostgreSQL
```

---

## 🎨 Frontend (React)

**Pages:**
| Route | Page |
|-------|------|
| `/dashboard` | Master Dashboard — KPIs, charts, activity feed |
| `/users` | Users Management — member table + add user form |
| `/properties` | Property Management — cards, registry table, add form |
| `/leads` | Leads CRM — pipeline, analytics, conversations |
| `/reports` | Reports & Analytics — revenue, funnel, leaderboard |

### Setup & Run

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

---

## 🔧 Backend (NestJS)

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login → returns JWT token |
| GET | `/api/users` | List users (paginated, searchable) |
| POST | `/api/users` | Create user |
| PATCH | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/users/stats` | User statistics |
| GET | `/api/properties` | List properties |
| POST | `/api/properties` | Add property |
| GET | `/api/properties/featured` | Featured listings |
| GET | `/api/properties/stats` | Property statistics |
| PATCH | `/api/properties/:id` | Update property |
| DELETE | `/api/properties/:id` | Delete property |
| GET | `/api/leads` | List leads (CRM) |
| POST | `/api/leads` | Add lead |
| GET | `/api/leads/stats` | Lead pipeline stats |
| PATCH | `/api/leads/:id` | Update lead |
| GET | `/api/reports/dashboard` | Dashboard KPIs |
| GET | `/api/reports/revenue` | Revenue by month |
| GET | `/api/reports/funnel` | Lead conversion funnel |
| GET | `/api/reports/districts` | Property performance by district |
| GET | `/api/reports/agents` | Agent leaderboard |

### Setup & Run

#### 1. Create PostgreSQL Database

```bash
psql -U postgres -c "CREATE DATABASE tamizha_properties;"
```

#### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

#### 3. Install & Start

```bash
npm install
npm run start:dev
# API runs at http://localhost:3001/api
```

TypeORM will **auto-create all tables** on first run (`synchronize: true` in dev mode).

#### 4. Seed Initial Data (Optional)

```bash
psql -U postgres -d tamizha_properties -f database/init.sql
```

---

## 🗄️ Database Schema

### `users` table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR | Full name |
| email | VARCHAR | Unique email |
| phone | VARCHAR | Phone number |
| city | VARCHAR | Current city |
| native_place | VARCHAR | Home district |
| status | ENUM | Active / NRI Premium / Pending / Inactive |
| role | ENUM | admin / agent / user |
| password | VARCHAR | Bcrypt hashed |
| created_at | TIMESTAMP | Join date |

### `properties` table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | VARCHAR | Property name |
| description | TEXT | Full description |
| location | VARCHAR | Address |
| district | ENUM | Tirunelveli / Chennai / Coimbatore / Tenkasi / Malaysia / ... |
| price | DECIMAL | Price in rupees |
| price_label | VARCHAR | Display label (₹4.2 Cr) |
| sqft | INT | Square footage |
| ground | DECIMAL | Ground area |
| status | ENUM | For Sale / Sold / Premium / New Launch / Draft |
| img_type | VARCHAR | land / coast / villa / city / estate |
| is_rera_verified | BOOLEAN | RERA approved? |
| is_featured | BOOLEAN | Featured listing? |
| offer_code | VARCHAR | Promo code |
| bank_offer | VARCHAR | Bank offer details |
| images | JSONB | Array of image URLs |
| video_url | VARCHAR | Walkthrough video URL |
| views_count | INT | Page views |
| leads_count | INT | Enquiry count |

### `leads` table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR | Lead name |
| phone | VARCHAR | Phone number |
| email | VARCHAR | Email |
| city | VARCHAR | Current location |
| property_interest | VARCHAR | Property they enquired about |
| status | ENUM | HOT / WARM / NEW / CLOSED / LOST |
| source | ENUM | User App / WhatsApp / Web Referral / Walk-in |
| time_spent | VARCHAR | Time on property page |
| assigned_agent | VARCHAR | Agent name |
| notes | TEXT | CRM notes |
| last_contact | TIMESTAMP | Last interaction |
| follow_up_date | TIMESTAMP | Scheduled follow-up |

---

## 🔐 Authentication

All API endpoints (except `/api/auth/login`) require JWT Bearer token:

```
Authorization: Bearer <your_access_token>
```

**Default Admin Login:**
- Email: `admin@tamizhaproperties.com`
- Password: `Admin@123`

---

## 🎨 Design System

The dashboard uses a consistent design language:
- **Primary Gold:** `#E2C36D` / `#C5A44E`
- **Dark Ink:** `#0E1117`
- **Background:** `#F4F5F8`
- **Fonts:** Fraunces (display), Plus Jakarta Sans (body), JetBrains Mono (mono)
- **5 Pages:** Dashboard, Users, Properties, Leads CRM, Reports

---

## 🚀 Quick Start (Both Services)

```bash
# Terminal 1 — Frontend
cd "tamizha properties web main/frontend"
npm install && npm run dev

# Terminal 2 — Backend  
cd "tamizha properties web main/backend"
cp .env.example .env   # edit with your DB credentials
npm install && npm run start:dev
```

Visit **http://localhost:3000** to see the dashboard.
=======
# tamizha_properties



## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

* [Create](https://docs.gitlab.com/user/project/repository/web_editor/#create-a-file) or [upload](https://docs.gitlab.com/user/project/repository/web_editor/#upload-a-file) files
* [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://code.zeeyes.com/subramaniyam/tamizha_properties.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

* [Set up project integrations](https://code.zeeyes.com/subramaniyam/tamizha_properties/-/settings/integrations)

## Collaborate with your team

* [Invite team members and collaborators](https://docs.gitlab.com/user/project/members/)
* [Create a new merge request](https://docs.gitlab.com/user/project/merge_requests/creating_merge_requests/)
* [Automatically close issues from merge requests](https://docs.gitlab.com/user/project/issues/managing_issues/#closing-issues-automatically)
* [Enable merge request approvals](https://docs.gitlab.com/user/project/merge_requests/approvals/)
* [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

* [Get started with GitLab CI/CD](https://docs.gitlab.com/ci/quick_start/)
* [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/user/application_security/sast/)
* [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/topics/autodevops/requirements/)
* [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/user/clusters/agent/)
* [Set up protected environments](https://docs.gitlab.com/ci/environments/protected_environments/)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
>>>>>>> 4fe5c53bcf49354cbb4a0ea85dcf714f0a4a8dd8
