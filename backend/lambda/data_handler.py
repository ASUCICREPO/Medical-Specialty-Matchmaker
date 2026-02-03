import json
import boto3
import logging
from datetime import datetime
from decimal import Decimal
import os

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('REQUESTS_TABLE', 'medical-requests')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    """
    Main Lambda handler for storing medical requests in DynamoDB
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Parse the request
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        data = body.get('data', {})
        
        if action == 'submit':
            return handle_submit_request(data)
        elif action == 'get':
            return handle_get_request(data)
        elif action == 'list':
            return handle_list_requests(data)
        else:
            return create_response(400, {'error': 'Invalid action'})
            
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}")
        return create_response(500, {'error': 'Internal server error', 'message': str(e)})

def handle_submit_request(data: dict) -> dict:
    """
    Store medical request in DynamoDB
    """
    try:
        # Generate unique request ID
        timestamp = datetime.utcnow()
        request_id = f"REQ-{timestamp.strftime('%Y%m%d%H%M%S')}-{timestamp.microsecond}"
        
        # Prepare item for DynamoDB
        item = {
            'id': request_id,
            'doctorName': data.get('doctorName', ''),
            'hospital': data.get('hospital', ''),  # Added hospital/clinic name
            'location': data.get('location', ''),
            'email': data.get('email', ''),
            'ageGroup': data.get('ageGroup', ''),  # Required age group (Adult/Child)
            'symptoms': data.get('symptoms', ''),
            'urgency': data.get('urgency', 'medium'),
            'additionalInfo': data.get('additionalInfo', ''),
            'specialty': data.get('specialty', ''),
            'subspecialty': data.get('subspecialty', ''),
            'reasoning': data.get('reasoning', ''),
            'createdAt': timestamp.isoformat()
        }
        
        # Remove empty fields
        item = {k: v for k, v in item.items() if v not in [None, '', []]}
        
        # Store in DynamoDB
        logger.info(f"Storing request in DynamoDB: {request_id}")
        table.put_item(Item=item)
        
        logger.info(f"Successfully stored request: {request_id}")
        
        return create_response(200, {
            'success': True,
            'id': request_id,
            'message': 'Request submitted successfully',
            'timestamp': timestamp.isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in handle_submit_request: {str(e)}")
        raise

def handle_get_request(data: dict) -> dict:
    """
    Retrieve a specific medical request from DynamoDB
    """
    try:
        request_id = data.get('id')
        
        if not request_id:
            return create_response(400, {'error': 'Request ID is required'})
        
        response = table.get_item(Key={'id': request_id})
        
        if 'Item' not in response:
            return create_response(404, {'error': 'Request not found'})
        
        # Convert Decimal to float for JSON serialization
        item = convert_decimals(response['Item'])
        
        return create_response(200, {
            'success': True,
            'request': item
        })
        
    except Exception as e:
        logger.error(f"Error in handle_get_request: {str(e)}")
        raise

def handle_list_requests(data: dict) -> dict:
    """
    List medical requests with optional filtering
    """
    try:
        # Get filter parameters
        status = data.get('status')
        specialty = data.get('specialty')
        limit = data.get('limit', 50)
        
        # Build scan parameters
        scan_kwargs = {
            'Limit': min(limit, 100)  # Cap at 100
        }
        
        # Add filters if provided
        filter_expressions = []
        expression_attribute_values = {}
        
        if status:
            filter_expressions.append('#status = :status')
            expression_attribute_values[':status'] = status
            scan_kwargs['ExpressionAttributeNames'] = {'#status': 'status'}
        
        if specialty:
            filter_expressions.append('specialty = :specialty')
            expression_attribute_values[':specialty'] = specialty
        
        if filter_expressions:
            scan_kwargs['FilterExpression'] = ' AND '.join(filter_expressions)
            scan_kwargs['ExpressionAttributeValues'] = expression_attribute_values
        
        # Scan table
        response = table.scan(**scan_kwargs)
        items = response.get('Items', [])
        
        # Convert Decimals to float for JSON serialization
        items = [convert_decimals(item) for item in items]
        
        # Sort by timestamp (most recent first)
        items.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return create_response(200, {
            'success': True,
            'requests': items,
            'count': len(items)
        })
        
    except Exception as e:
        logger.error(f"Error in handle_list_requests: {str(e)}")
        raise

def convert_to_decimal(value):
    """
    Convert float to Decimal for DynamoDB
    """
    if isinstance(value, float):
        return Decimal(str(value))
    return value

def convert_decimals(obj):
    """
    Convert Decimal objects to float for JSON serialization
    """
    if isinstance(obj, list):
        return [convert_decimals(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_decimals(value) for key, value in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj)
    else:
        return obj

def create_response(status_code: int, body: dict) -> dict:
    """
    Create standardized API response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps(body)
    }
