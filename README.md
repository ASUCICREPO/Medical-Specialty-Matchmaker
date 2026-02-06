# Medical Specialty Matchmaker

An AI-powered medical triage system that helps healthcare professionals in resource-constrained settings connect with volunteer medical experts worldwide. The system uses AWS Bedrock AI to intelligently classify medical cases and match them with appropriate specialists.

## Demo Video

Watch the complete demonstration of Medical Specialty Matchmaker:

<div align="center">
<a href="https://drive.google.com/file/d/1Cf9XYbZ6QQ2NUoV5mO3h2UIcKCmaastJ/view?usp=sharing">
<img src="./docs/media/demo-thumbnail.png" alt="Medical Specialty Matchmaker Demo" width="650">
</a>
<p><em>Click the image above to watch the demo</em></p>
</div>

## Disclaimers

Customers are responsible for making their own independent assessment of the information in this document.

This document:

(a) is for informational purposes only,

(b) represents current AWS product offerings and practices, which are subject to change without notice, and

(c) does not create any commitments or assurances from AWS and its affiliates, suppliers or licensors. AWS products or services are provided "as is" without warranties, representations, or conditions of any kind, whether express or implied. The responsibilities and liabilities of AWS to its customers are controlled by AWS agreements, and this document is not part of, nor does it modify, any agreement between AWS and its customers.

(d) is not to be considered a recommendation or viewpoint of AWS

Additionally, all prototype code and associated assets should be considered:

(a) as-is and without warranties

(b) not suitable for production environments

(d) to include shortcuts in order to support rapid prototyping such as, but not limited to, relaxed authentication and authorization and a lack of strict adherence to security best practices

All work produced is open source. More information can be found in the GitHub repo.

## Index

| Description           | Link                                                  |
| --------------------- | ----------------------------------------------------- |
| Overview              | [Overview](#overview)                                 |
| Architecture          | [Architecture](#architecture-diagram)                 |
| Quick Start           | [Quick Start](#quick-start)                           |
| Documentation         | [Documentation](#documentation)                       |
| Credits               | [Credits](#credits)                                   |
| License               | [License](#license)                                   |

## Overview

This application combines AI-powered conversational intelligence with systematic medical triage to connect healthcare professionals with appropriate specialists. Built on a serverless AWS architecture with dual AI models, the system provides intelligent case classification across 30+ medical specialties and 200+ subspecialties, enabling sustainable medical expertise delivery to resource-constrained hospitals and clinics globally.

### Key Features

- **AI-Powered Triage** powered by AWS Bedrock with Claude 3.5 Haiku and Amazon Nova 2 Lite
- **Conversational Interface** with intelligent follow-up questions to gather necessary information
- **Multi-Specialty Support** covering 30+ primary specialties and 200+ subspecialties
- **Pediatric & Adult Routing** with age-appropriate specialty matching
- **Confidence Scoring** with 90% threshold for subspecialty classification
- **Privacy-First Design** with no personally identifiable patient information collected
- **Real-time Classification** providing immediate specialty recommendations
- **Request Management** with DynamoDB storage for retrieval

## Architecture Diagram

![Architecture Diagram](./docs/media/architecture.png)

- **Frontend**: React frontend using Next.js framework hosted on AWS Amplify
- **Backend**: AWS CDK deployable backend infrastructure for API Gateway, Lambdas, Bedrock, and DynamoDB

For a detailed deep dive into the architecture, including core principles, component interactions, data flow, security, and implementation details, see [docs/architectureDeepDive.md](docs/architectureDeepDive.md).

## Quick Start

1. **Configure AWS credentials**
   ```bash
   # For AWS SSO (recommended)
   aws sso login --profile your-profile-name
   export AWS_PROFILE=your-profile-name
   export AWS_REGION=us-west-2
   ```

2. **Clone the repository**
   ```bash
   git clone https://github.com/ASUCICREPO/Medical-Specialty-Matchmaker.git
   cd Medical-Specialty-Matchmaker
   ```

3. **Set up GitHub token (optional, for Amplify auto-deploy)**
   ```bash
   aws secretsmanager create-secret \
     --name "github-token" \
     --description "GitHub Personal Access Token for Amplify" \
     --secret-string "your-github-token-here" \
     --region us-west-2
   ```

4. **Run the deployment script**
   ```bash
   bash ./deploy.sh
   ```

## Documentation

- **[API Documentation](docs/APIDoc.md)** - Comprehensive API reference for all endpoints
- **[Architecture Deep Dive](docs/architectureDeepDive.md)** - Detailed system architecture and design
- **[Deployment Guide](docs/deploymentGuide.md)** - Deployment instructions, prerequisites and step-by-steps
- **[User Guide](docs/userGuide.md)** - Step-by-step usage instructions
- **[Modification Guide](docs/modificationGuide.md)** - Guide for customizing and extending the system
- **[Model Justification](docs/modelJustification.md)** - Rationale for AI model selection

## Credits

This application was developed by:

- **Shawn Neill** - Full Stack Developer (<a href="https://www.linkedin.com/in/shawnneill24/" target="_blank">LinkedIn<a>)
- **Jenny Nguyen** - UI/UX Developer (<a href="https://www.linkedin.com/in/jennnyen/" target="_blank">LinkedIn<a>)

## License

See [LICENSE](LICENSE) file for details.
