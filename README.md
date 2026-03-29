# Patient Assessment Frontend

React frontend for a clinical workflow where users can:

- Register/login
- Create and view patients
- Create clinical assessments for patients
- View assessment reports

## How to Use the App (User Guide)

### 1) Register / Login

- Go to `/register` to create an account.
- Go to `/login` to sign in.
- After login you are redirected to the Patients page.

### 2) Patients

- **View patients:** go to `/patients`.
- **Add a patient:** click **New Patient** (or go to `/patients/new`).
- **View a patient:** click a patient in the list to open `/patients/:id`.
- **Patient History:** from a patient, open **History** (route: `/patients/:id/history`).

### 3) Create a New Assessment (Type Selector → Form)

Assessments are created from a patient context.

1. Open a patient’s History: `/patients/:id/history`.
2. Click **+ New Assessment**.
3. Select an **Assessment Type** (this controls which sections show in the form).
4. Fill in the assessment details and submit.

Notes:

- Assessment “type” is currently a UI concept (used to show/hide sections). It is not stored in the backend assessment DTO, so the backend will not return a type value unless the backend is extended.

### 4) Nurse “Done” Decision (Required Before Report Generation)

In **Patient History**, each assessment row has a **Done** checkbox.

- Use **Done** to mark that the nurse has finished reviewing/deciding that assessment.
- The Daily Combined Report can only be generated when **all assessments for the selected date** are marked **Done**.

Important:

- Done state is stored in the browser using `localStorage` (per patient). It will not automatically sync between devices/browsers.

### 5) Generate the Daily Combined Report (Main Reporting Flow)

This is the intended workflow to generate AI output.

1. Go to **Patient History**: `/patients/:id/history`.
2. In the **Assessment History** header, choose a **date**.
3. Mark **Done** for every assessment on that date.
4. Click **Generate Daily Report**.

You will get a combined report that:

- Includes **all assessments** on that date (chronological order)
- Shows a summary section (ranges)
- Includes each assessment’s AI report text

The report modal supports:

- **Copy** (copies a clean text version)
- **Regenerate**
- **Save** (downloads a `.md` file)

### 6) About Individual Assessment Report Pages

The route `/assessments/:id/report` is now display-only:

- It does **not** generate an AI report.
- It only displays an AI report if one is already present on the assessment.

If no AI report is present, use the Patient History daily report flow.

## Tech Stack

- React 18 (Create React App)
- React Router
- Axios
- `react-hot-toast`

## Quick Start

### Prerequisites

- Node.js (LTS recommended)
- npm

### Install

```bash
npm install
```

### Run (development)

```bash
npm start
```

The app runs at http://localhost:3000 by default.

### Build (production)

```bash
npm run build
```

## App Routes (high level)

- `/login` – login screen
- `/register` – registration screen
- `/patients` – patient list
- `/patients/new` – create patient
- `/patients/:id` – patient details
- `/assessments/new` – create assessment (supports `?patientId=...`)
- `/assessments/:id/report` – assessment report

## Authentication

- On login, the app stores a JWT token in `localStorage` under `token`.
- Requests automatically include `Authorization: Bearer <token>` (see [src/services/api.js](src/services/api.js)).
- If the backend returns `401`, the app clears auth state and redirects to `/login`.

## Backend API

The frontend is configured to call:

- `https://patientreport123.runasp.net/api`

You can change the base URL in [src/services/api.js](src/services/api.js).

### Endpoints Used

- Auth
	- `POST /Auth/register`
	- `POST /Auth/login`
	- `POST /Auth/logout`
- Patients
	- `GET /Patients`
	- `GET /Patients/{id}`
	- `POST /Patients`
- Assessments
	- `POST /Assessments`
	- `GET /Assessments/{id}`
	- `GET /Assessments/{id}/report` (used only when generating Daily Combined Report)
	- `GET /Patients/{id}/assessments`

### API Payload Contracts

Patient create payload (frontend matches this shape):

```json
{
	"firstName": "string",
	"lastName": "string",
	"dateOfBirth": "2026-03-28T20:36:43.782Z",
	"gender": "string",
	"phoneNumber": "string",
	"address": "string"
}
```

Assessment create payload is a flat DTO (the UI collects these fields):

```json
{
	"patientId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
	"nurseNotes": "string",
	"bloodPressure": "string",
	"pulseRate": 0,
	"respiratoryRate": 0,
	"spO2": 0,
	"temperature": 0,
	"oxygenGiven": true,
	"ivStarted": true,
	"cprPerformed": true,
	"isAlert": true,
	"isOriented": true,
	"skinWarm": true,
	"skinDry": true,
	"skinPale": true,
	"skinCool": true,
	"skinHot": true,
	"skinFlushed": true,
	"skinCyanotic": true,
	"skinClammy": true,
	"skinJaundice": true,
	"skinDiaphoretic": true,
	"respiratorySymmetrical": true,
	"respiratoryAsymmetrical": true,
	"lungSounds": "string",
	"oxygenSaturation": 0,
	"gaitSteady": true,
	"usesCane": true,
	"usesCrutches": true,
	"usesWheelchair": true,
	"bedridden": true,
	"requiresAssistance": true
}
```

## Project Structure

- UI components live under `src/components/`
- API clients live under `src/services/`
- Auth state is managed in `src/contexts/AuthContext.jsx`

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
