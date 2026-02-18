# Mount Meru AI - Hospital Data Analytics Platform

A comprehensive hospital data analytics platform designed for clinical and managerial decision-making in Tanzanian healthcare facilities. Aligned with Tanzania HMIS & DHIS2 standards.

## Features

- **Data Analytics**: Advanced analytics for hospital operations and clinical data
- **AI-Powered Insights**: Intelligent suggestions and trend analysis
- **Department Management**: Dynamic department configuration and monitoring
- **Patient Records**: Comprehensive patient data management
- **Dashboard & Reports**: Real-time dashboards and customizable reports
- **Multi-Department Support**: OPD, IPD, Laboratory, Pharmacy, RCH, Theatre, and Mortuary
- **Role-Based Access**: Administrator, Data Analyst, Clinician, and other healthcare roles

## Technology Stack

- **Frontend**: Next.js 16 with TypeScript
- **Backend**: Node.js with TiDB Cloud database
- **UI**: Modern responsive design with Tailwind CSS
- **Authentication**: Secure user authentication and authorization
- **API**: RESTful API endpoints for all operations

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MySQL/TiDB database connection
- Environment variables configured

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Elia-Walles/mount-meru-AI.git
cd mount-meru-AI
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your database configuration
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to access the application.

## Database Setup

The application uses TiDB Cloud for data storage. Ensure you have the following environment variables configured:

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`

The database schema is automatically initialized on first run.

## Project Structure

- `app/` - Next.js app router pages and API routes
- `components/` - Reusable React components
- `lib/` - Utility functions and database services
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions
- `public/` - Static assets including the Mount Meru logo

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

This application can be deployed on any platform that supports Node.js applications. The build process creates an optimized production bundle ready for deployment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and inquiries, please contact the development team or create an issue in the repository.
