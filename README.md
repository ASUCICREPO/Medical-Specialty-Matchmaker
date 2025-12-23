# Medical Specialty Matchmaker

A chatbot application that helps healthcare professionals in resource-constrained settings connect with volunteer medical experts worldwide. The system uses AI to classify medical cases and match them with appropriate specialists.

## Mission

We provide sustainable medical expertise to resource-constrained hospitals and clinics globally, through a corps of volunteer healthcare professionals supported by telehealth technology. Local clinicians are upskilled so they can serve more of their own community and patients receive advanced healthcare.

## Features

- **Intelligent Case Classification**: AI-powered analysis of symptoms to identify appropriate medical specialties
- **Guided Form Filling**: Step-by-step chatbot interface to collect necessary information
- **Privacy-First Design**: No personally identifiable patient information is collected
- **Multi-Specialty Matching**: Supports matching across various medical specialties including:
  - Pediatrics
  - Dermatology
  - Infectious Disease
  - Cardiology
  - Neurology
  - Gastroenterology
  - Orthopedics
  - Pulmonology
  - Emergency Medicine
  - General Medicine

## Architecture

### Frontend (Next.js)
- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS
- **Components**: Modular chatbot interface with form validation
- **API Routes**: Built-in API endpoints for chatbot logic

### Backend (AWS CDK)
- **Infrastructure**: AWS CDK for cloud resources
- **AI/ML**: AWS Bedrock with Claude 3 Haiku for intelligent conversations and classification
- **Database**: DynamoDB for storing medical requests
- **API**: AWS API Gateway with Lambda functions
- **Classification**: AI-powered symptom analysis and specialty matching with automatic fallback

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- AWS CLI configured (for backend deployment)

### Frontend Development

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Backend Deployment

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Deploy to AWS:
```bash
npm run cdk deploy
```

## Usage

1. **Start Conversation**: The chatbot greets users and explains the process
2. **Describe Case**: Users provide initial symptoms and case description
3. **Fill Form**: Complete structured form with:
   - Doctor name and contact information
   - Patient age (no identifying information)
   - Detailed symptoms description
   - Urgency level
   - Additional context
4. **AI Classification**: System analyzes case and recommends appropriate specialties
5. **Expert Matching**: Request is routed to available volunteer specialists

## Privacy & Security

- No personally identifiable patient information is collected
- All data is anonymized and aggregated
- HIPAA-compliant design principles
- Secure data transmission and storage

## Future Enhancements

- **Multilingual Support**: Spanish, French, and Ukrainian language support
- **Advanced AI**: Integration with medical knowledge bases and ML models
- **Real-time Matching**: Live availability tracking for volunteer specialists
- **Telemedicine Integration**: Direct video consultation capabilities
- **Mobile App**: Native mobile applications for field use

## Contributing

This project is designed to serve healthcare professionals in underserved communities. Contributions are welcome, especially from medical professionals and developers with healthcare experience.

## License

This project is developed for humanitarian purposes to improve global healthcare access.