# User Guide

This guide provides step-by-step instructions for using the Medical Specialty Matchmaker.

## Prerequisites

**Please ensure the application is deployed before proceeding.** See the [Deployment Guide](./deploymentGuide.md) for deployment instructions.

## Introduction

The Medical Specialty Matchmaker is an AI-powered medical triage system that helps healthcare professionals in resource-constrained settings connect with volunteer medical experts worldwide. The system uses AWS Bedrock AI to intelligently classify medical cases and match them with appropriate specialists across 30+ medical specialties and 200+ subspecialties.

The Medical Specialty Matchmaker is designed to help doctors and healthcare professionals quickly identify the right specialist for their patients. Through a conversational interface, the system gathers necessary information and provides intelligent specialty recommendations with high confidence.

### Key Features

- **AI-Powered Triage**: Intelligent case classification using Claude 3.5 Haiku and Amazon Nova 2 Lite
- **Conversational Interface**: Natural dialogue to gather patient information systematically
- **Multi-Specialty Support**: 30+ primary specialties and 200+ subspecialties
- **Pediatric & Adult Routing**: Age-appropriate specialty matching
- **Confidence Scoring**: 90% confidence threshold for subspecialty classification
- **Privacy-First Design**: No personally identifiable patient information collected
- **Real-time Classification**: Immediate specialty recommendations when sufficient information is gathered

## Getting Started

### Step 1: Access the Application

Navigate to the application URL provided after deployment (typically an AWS Amplify URL).

The landing page displays:
- The Medical Specialty Matchmaker header
- A chat interface with a welcome message
- A text input field at the bottom for entering patient information
- Clear instructions for getting started

### Step 2: Start a Conversation

The system will greet you and ask: **"Is the patient a child or an adult?"**

Select or type your response:
- **"Child (0-17 years)"** for pediatric cases
- **"Adult"** for adult cases

This initial information helps the system route to age-appropriate specialties.

### Step 3: Describe the Patient's Condition

After selecting the age group, the system will ask you to describe the patient's condition.

Provide information about:
- Main symptoms
- Duration and onset
- Severity
- Relevant medical history
- Any other pertinent details

**Example:**
```
"My patient has a shattered hip from falling down the stairs. 
The patient is 8 years old, experiencing severe pain, and 
cannot bear any weight on the affected leg."
```

### Step 4: Answer Follow-up Questions

The AI will ask 2-3 targeted follow-up questions to gather sufficient information for accurate classification. These questions help narrow down the appropriate subspecialty.

**Example follow-up questions:**
- "How long ago did the injury occur?"
- "Are there any other injuries besides the hip?"
- "Has the patient had any imaging done (X-ray, CT scan)?"
- "What is the patient's pain level on a scale of 1-10?"

Answer each question as completely as possible. The more specific information you provide, the more accurate the classification will be.

### Step 5: Review the Classification

Once the system has gathered sufficient information (90% confidence threshold), it will provide:

**Classification Results:**
- **Primary Specialty**: The main medical specialty (e.g., "Orthopaedic Surgeon")
- **Subspecialty**: The specific subspecialty (e.g., "Pediatric Orthopaedic Surgery")
- **Reasoning**: Explanation for why this specialty was chosen
- **Confidence Score**: How confident the system is in the classification (0.7-1.0)
- **Urgency Assessment**: Low, medium, or high urgency

**Example Classification:**
```
Based on the information provided, I recommend:

Primary Specialty: Orthopaedic Surgeon
Subspecialty: Pediatric Orthopaedic Surgery

Reasoning: Child with traumatic hip fracture requires specialized 
pediatric orthopedic care for proper bone healing and growth plate 
management. The severity and age of the patient necessitate a 
specialist with expertise in pediatric trauma.

Confidence: 95%
Urgency: High
```

### Step 6: Submit the Request

After receiving the classification, you can submit the complete request with your information:

**Required Information:**
- Doctor's name
- Hospital or clinic name
- Location
- Contact email
- Additional notes (optional)

The system will:
- Generate a unique request ID
- Store the complete case information
- Provide confirmation of submission
- Display the request ID for future reference

## Common Use Cases

### Use Case 1: Pediatric Emergency

**Scenario**: A child presents with a traumatic injury requiring urgent specialist consultation.

**Steps:**
1. Select "Child (0-17 years)" when asked about age group
2. Describe the injury: "8-year-old fell down stairs, shattered hip, severe pain, cannot walk"
3. Answer follow-up questions about timing, other injuries, and pain level
4. Review classification: Orthopaedic Surgeon → Pediatric Orthopaedic Surgery
5. Submit request with your contact information

**Expected Outcome**: High-confidence classification to pediatric orthopedic surgery with high urgency assessment.

### Use Case 2: Adult Chronic Condition

**Scenario**: An adult patient with ongoing symptoms needs specialist referral.

**Steps:**
1. Select "Adult" when asked about age group
2. Describe symptoms: "45-year-old with persistent chest pain, shortness of breath, and fatigue for 3 months"
3. Answer questions about symptom patterns, triggers, and medical history
4. Review classification: Internist → Cardiovascular Disease
5. Submit request for specialist consultation

**Expected Outcome**: Classification to cardiology with medium urgency, detailed reasoning about cardiovascular concerns.

### Use Case 3: Complex Multi-System Case

**Scenario**: A patient with multiple symptoms that could indicate various conditions.

**Steps:**
1. Select appropriate age group
2. Describe all symptoms comprehensively
3. Answer detailed follow-up questions about each symptom system
4. Provide medical history and current medications
5. Review classification with reasoning
6. Submit request with additional context in notes

**Expected Outcome**: The AI will ask more questions to narrow down the primary concern and provide the most appropriate specialty match.

## Tips and Best Practices

### For Accurate Classification

- **Be Specific**: Provide detailed symptom descriptions including onset, duration, severity, and progression
- **Include Context**: Mention relevant medical history, medications, allergies, and previous treatments
- **Answer Completely**: Respond to all follow-up questions thoroughly
- **Use Medical Terminology**: When appropriate, use medical terms for more precise classification
- **Indicate Urgency**: Clearly state if the case is urgent or emergent

### For Efficient Workflow

- **Prepare Information**: Gather patient information before starting the conversation
- **One Case at a Time**: Complete each case before starting a new one
- **Save Request IDs**: Keep track of request IDs for follow-up
- **Provide Contact Info**: Ensure your email is correct for specialist communication

### For Privacy Compliance

- **No Patient Names**: Do not include patient names or identifiers
- **No Dates of Birth**: Avoid specific dates that could identify patients
- **No Contact Info**: Do not include patient phone numbers or addresses
- **Anonymize Details**: Use general descriptions rather than identifying information

## Understanding Confidence Scores

The system uses confidence scores to determine when it has enough information to classify:

### Confidence Levels

- **< 70%**: System continues gathering information
  - More questions will be asked
  - Classification not yet ready
  - Provide more specific details

- **70-89%**: Moderate confidence
  - Classification may be provided
  - Consider providing additional details
  - Review reasoning carefully

- **≥ 90%**: High confidence
  - Classification ready
  - Sufficient information gathered
  - Subspecialty identified with confidence

### What Affects Confidence

**Increases Confidence:**
- Specific symptom descriptions
- Clear timeline of events
- Relevant medical history
- Physical examination findings
- Diagnostic test results

**Decreases Confidence:**
- Vague symptom descriptions
- Multiple possible diagnoses
- Incomplete information
- Contradictory symptoms
- Lack of context

## Supported Medical Specialties

For a complete list, see the [API Documentation](./APIDoc.md#medical-specialties).

## Frequently Asked Questions (FAQ)

### Q: Is this system a replacement for medical judgment?

**A:** No. The Medical Specialty Matchmaker is a triage tool to help identify appropriate specialists. It does not replace clinical judgment, diagnosis, or treatment decisions. Healthcare professionals should always use their clinical expertise when making patient care decisions.

### Q: What information should I NOT include?

**A:** Do not include:
- Patient names or identifiers
- Dates of birth
- Patient contact information (phone, email, address)
- Medical record numbers
- Social security numbers
- Any other personally identifiable information (PII)

### Q: How accurate is the classification?

**A:** The system uses advanced AI models (Claude 3.5 Haiku and Amazon Nova 2 Lite) trained on medical specialty information. Classifications with 90%+ confidence are highly reliable, but should always be reviewed by healthcare professionals. The system provides reasoning for each classification to support clinical decision-making.

### Q: Can I classify multiple patients at once?

**A:** No. The system is designed for one case at a time to maintain conversation context and ensure accurate classification. Complete each case before starting a new one.

### Q: What if I disagree with the classification?

**A:** The classification is a recommendation based on the information provided. Healthcare professionals should use their clinical judgment. If you disagree:
- Review the reasoning provided
- Consider if additional information might change the classification
- Use your professional expertise to determine the appropriate specialist
- Document your reasoning for the final decision

### Q: How long does classification take?

**A:** Typically 2-5 minutes depending on case complexity:
- Simple cases: 2-3 questions, ~2 minutes
- Moderate cases: 3-4 questions, ~3 minutes
- Complex cases: 4-5 questions, ~5 minutes

### Q: Can I save incomplete cases?

**A:** Currently, the system does not save incomplete conversations. If you need to pause, note the information gathered so far and restart when ready.

### Q: What happens after I submit a request?

**A:** After submission:
- A unique request ID is generated
- The case is stored in the database
- You receive confirmation with the request ID
- The information is available for specialist matching
- (Future feature: Automated specialist notification)

## Troubleshooting

### Issue: System not asking follow-up questions

**Solution:**
- Ensure you provided an initial symptom description
- Try providing more specific details
- Check that your internet connection is stable
- Refresh the page and start over if needed

### Issue: Classification confidence is low

**Solution:**
- Provide more specific symptom details
- Include duration, onset, and progression
- Mention relevant medical history
- Answer all follow-up questions completely
- Include physical examination findings if available

### Issue: Classification seems incorrect

**Solution:**
- Review the reasoning provided by the system
- Consider if the information provided was complete
- Check if symptoms could indicate multiple specialties
- Use your clinical judgment to determine the appropriate specialist
- Provide additional context in the notes field when submitting

### Issue: Cannot submit request

**Solution:**
- Check that all required fields are filled
- Verify email format is correct
- Ensure internet connection is stable
- Try refreshing the page
- Check browser console for error messages

### Issue: Page not loading or slow response

**Solution:**
- Check internet connection
- Refresh the page
- Clear browser cache
- Try a different browser
- Check if AWS services are experiencing issues
- Contact system administrator if problem persists

### Issue: Error message appears

**Solution:**
- Read the error message carefully
- Common errors:
  - "Gateway Timeout": System is processing, wait and try again
  - "Invalid request": Check that all information is provided
  - "Server error": Contact system administrator
- Check CloudWatch logs if you have admin access
- Report persistent errors to technical support

## Privacy and Security

### Data Protection

The Medical Specialty Matchmaker is designed with privacy as a priority:

- **No PII Collection**: System does not collect patient names, dates of birth, or contact information
- **Anonymized Data**: All patient information is anonymized
- **HIPAA-Compliant Design**: Follows HIPAA design principles
- **Secure Transmission**: All data transmitted over HTTPS/TLS
- **Encrypted Storage**: Data encrypted at rest in DynamoDB

### Best Practices for Users

- Never include patient identifiers in symptom descriptions
- Use general terms (e.g., "8-year-old child" not "John Smith, DOB 1/1/2016")
- Avoid including specific dates that could identify patients
- Do not include patient contact information
- Review your descriptions before submitting to ensure no PII is included

### Data Retention

- Request data is stored in DynamoDB for specialist matching
- Conversation history is maintained during the session
- Data retention policies can be configured by administrators
- Contact your administrator for data deletion requests

## Getting Help

If you encounter issues not covered in this guide:

### For Users
- Review this user guide thoroughly
- Check the [Troubleshooting](#troubleshooting) section
- Contact your system administrator
- Report bugs or issues through your organization's support channels

### For Administrators
- Check [Architecture Deep Dive](./architectureDeepDive.md) for system details
- Review [API Documentation](./APIDoc.md) for technical information
- Check CloudWatch logs for error details
- See [Modification Guide](./modificationGuide.md) for customization options
- Open an issue on GitHub for technical support

### For Developers
- Review the [Modification Guide](./modificationGuide.md) for customization
- Check [API Documentation](./APIDoc.md) for integration details
- See [Architecture Deep Dive](./architectureDeepDive.md) for system design
- Contribute improvements via GitHub pull requests

## Next Steps

- Explore the [API Documentation](./APIDoc.md) for programmatic access
- Check the [Architecture Deep Dive](./architectureDeepDive.md) to understand how the system works
- See the [Modification Guide](./modificationGuide.md) if you want to customize the application
- Review the [Deployment Guide](./deploymentGuide.md) for deployment and configuration options

## Feedback and Contributions

We welcome feedback and contributions to improve the Medical Specialty Matchmaker:

- Report bugs or issues on GitHub
- Suggest new features or improvements
- Contribute code enhancements
- Share your use cases and success stories
- Help improve documentation

Together, we can improve global healthcare access by connecting healthcare professionals with the specialists they need.
