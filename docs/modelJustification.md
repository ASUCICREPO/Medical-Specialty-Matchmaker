# Model Justification

This document explains the rationale behind the AI model selection for the Medical Specialty Matchmaker system.


## Executive Summary

The Medical Specialty Matchmaker uses two AWS Bedrock models for different tasks:
- **Claude 3.5 Haiku** for conversational chat
- **Amazon Nova 2 Lite** for data extraction and classification

This dual-model approach optimizes for both conversational quality and classification accuracy while maintaining cost-effectiveness and low latency.

## Table of Contents

1. [Model Selection Criteria](#model-selection-criteria)
2. [Claude 3.5 Haiku for Conversational Chat](#claude-35-haiku-for-conversational-chat)
3. [Amazon Nova 2 Lite for Classification](#amazon-nova-2-lite-for-classification)
4. [Alternative Models Considered](#alternative-models-considered)
5. [Performance Evaluation](#performance-evaluation)
6. [Cost Analysis](#cost-analysis)
7. [Future Considerations](#future-considerations)

## Model Selection Criteria

### Key Requirements

1. **Accuracy**: High accuracy in medical specialty classification (target: >90% confidence)
2. **Latency**: Fast response times for real-time chat (<3 seconds)
3. **Cost**: Cost-effective for humanitarian use case
4. **Availability**: Available in multiple AWS regions
5. **Context Understanding**: Ability to maintain conversation context
6. **Medical Knowledge**: Understanding of medical terminology and specialties
7. **Structured Output**: Ability to produce JSON-formatted responses
8. **Multilingual Support**: Potential for future language expansion

### Evaluation Metrics

- **Classification Accuracy**: Percentage of correct specialty matches
- **Response Time**: Average time to generate responses
- **Token Efficiency**: Tokens used per request
- **Cost per Request**: Average cost per classification
- **Confidence Calibration**: Alignment between confidence scores and accuracy

## Claude Haiku 3.5 for Conversational Chat

### Why Claude Haiku 3.5?

**Model ID**: `us.anthropic.claude-3-5-haiku-20241022-v1:0`

**Strengths:**
1. **Conversational Excellence**: Superior natural language understanding and generation
2. **Context Retention**: Excellent at maintaining conversation flow across multiple turns
3. **Medical Knowledge**: Strong understanding of medical terminology and concepts
4. **Follow-up Questions**: Generates intelligent, targeted follow-up questions
5. **Reasoning**: Provides clear explanations for recommendations
6. **Speed**: Fast inference times suitable for real-time chat
7. **Cost-Effective**: Lower cost than Sonnet/Opus while maintaining quality

**Configuration:**
```python
{
  "max_tokens": 2000,
  "temperature": 0.5,  # Balanced creativity and consistency
  "top_p": 0.999
}
```

**Use Cases in System:**
- Generating conversational responses to user messages
- Asking intelligent follow-up questions
- Providing medical guidance and clarification
- Maintaining natural dialogue flow
- Explaining classification reasoning

**Performance:**
- Average response time: 1.5-2.5 seconds
- Token efficiency: ~500-800 tokens per response
- User satisfaction: High (natural, helpful responses)

## Amazon Nova 2 Lite for Classification

### Why Amazon Nova 2 Lite?

**Model ID**: `us.amazon.nova-2-lite-v1:0`

**Strengths:**
1. **Structured Output**: Excellent at producing well-formatted JSON responses
2. **Classification Accuracy**: High accuracy in multi-class classification tasks
3. **Data Extraction**: Effective at extracting structured data from unstructured text
4. **Cost-Effective**: Lower cost than Claude models for classification tasks
5. **Fast Inference**: Quick response times for classification
6. **Confidence Scoring**: Reliable confidence scores for decision-making
7. **AWS Native**: Optimized for AWS infrastructure

**Configuration:**
```python
{
  "max_new_tokens": 2000,
  "temperature": 0.1,  # Low temperature for deterministic classification
  "top_p": 0.9
}
```

**Use Cases in System:**
- Extracting structured data (age group, symptoms, urgency) from conversations
- Classifying cases to primary specialty and subspecialty
- Generating confidence scores for classification readiness
- Producing JSON-formatted responses for frontend consumption

**Performance:**
- Average response time: 1.0-1.5 seconds
- Classification accuracy: ~>95% (based on internal testing)
- Confidence calibration: Strong correlation between confidence and accuracy

---

## Alternative Models Considered

### Claude Haiku 3
**Pros:**
- Decent response accuracy (~85%)
- Quick response times
- Low cost model that got the job done

**Cons:**
- Struggled to maintain full context
- Reasoning was decent but had room for improvement
- Lacked consistency, sometimes question too much or included unnecessary information

**Decision:** Not selected due to lacking in response accuracy and questioning.

### Claude Sonnet 4
**Pros:**
- High response accuracy (~95%)
- Better reasoning capabilities
- More detailed responses

**Cons:**
- Significantly higher cost
- Slower inference times
- Overkill for conversational chat
- Too wordy

**Decision:** Not selected due to cost and overkill

### Amazon Nova Pro
**Pros:**
- Internal testing showed good results

**Cons:**
- High cost
- Slow inference
- Throtting Issues during bedrock evaluations

**Decision:** Not selected due to cost and throtting concerns

## Performance Evaluation

### Evaluation Methodology

For testing data utilized, see the ![model-eval-data](./model-eval-data/) folder

**Test Dataset:**
- 100 synthetic medical cases across various specialties
- Mix of pediatric (30%) and adult (70%) cases
- Range of urgency levels (low: 20%, medium: 50%, high: 30%)
- Complexity levels (simple: 30%, moderate: 50%, complex: 20%)

**Evaluation Metrics:**
1. **Classification Accuracy**: Correct specialty match
2. **Subspecialty Accuracy**: Correct subspecialty match
3. **Confidence Calibration**: Correlation between confidence and accuracy
4. **Response Time**: Average time to complete classification
5. **Token Efficiency**: Average tokens used per case

### Results Summary

**Claude 3.5 Haiku (Conversational Chat):**
- Average response time: 2.1 seconds
- Average tokens per response: 650
- User satisfaction: 4.5/5 (based on internal testing)
- Follow-up question quality: High
- Context retention: Excellent

**Amazon Nova 2 Lite (Classification):**
- Classification accuracy: 92%
- Subspecialty accuracy: 88%
- Average response time: 1.3 seconds
- Confidence calibration: 0.85 correlation
- False positive rate (high confidence): <5%

**Combined System Performance:**
- End-to-end time: 3-5 minutes per case
- Overall accuracy: 90%+ for high-confidence classifications
- Cost per case: ~$0.02-0.04
- User completion rate: 85%

## Cost Analysis

### Cost Breakdown

**Claude 3.5 Haiku (Chat):**
- Input: $0.80 per 1M tokens
- Output: $4.00 per 1M tokens
- Average per conversation: ~3,000 input + 2,000 output tokens
- Cost per case: ~$0.01-0.015

**Amazon Nova 2 Lite (Classification):**
- Input: $0.06 per 1M tokens
- Output: $0.24 per 1M tokens
- Average per classification: ~2,000 input + 500 output tokens
- Cost per case: ~$0.0003-0.0005

**Total Cost per Case:**
- Chat (3-4 exchanges): ~$0.015-0.020
- Classification (2 calls): ~$0.001
- **Total: ~$0.02-0.03 per case**

### Monitoring and Optimization

**Ongoing Monitoring:**
- Track classification accuracy by specialty
- Monitor confidence calibration
- Analyze false positives/negatives
- Measure user satisfaction and completion rates

**Optimization Opportunities:**
- Prompt engineering refinements
- Temperature and parameter tuning
- Context window optimization
- Token usage reduction

### Regional Availability

**Current Regions:**
- us-west-2 (Oregon) - Primary
- us-east-1 (N. Virginia) - Alternative
- us-east-2 (Ohio) - Alternative

## Conclusion

The dual-model approach using Claude 3.5 Haiku for conversational chat and Amazon Nova 2 Lite for classification provides:

✅ **High Accuracy**: 90%+ for high-confidence classifications  
✅ **Low Latency**: 3-5 minutes end-to-end per case  
✅ **Cost-Effective**: ~$0.02-0.03 per case  
✅ **Scalable**: Serverless architecture handles variable load  
✅ **Maintainable**: AWS-native models with consistent APIs  

This combination optimally balances accuracy, speed, and cost for the humanitarian mission of connecting healthcare professionals with volunteer specialists worldwide.