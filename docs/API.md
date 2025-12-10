# API Documentation

SMM Panel provides a RESTful API for resellers and integrations.

## Base URL

```
Production: https://your-domain.com/api/v1
Development: http://localhost:3000/api/v1
```

## Authentication

### API Key

All API requests require an API key in the header:

```http
X-API-Key: your-api-key-here
```

### Generate API Key

1. Log in to your account
2. Navigate to Settings → API Keys
3. Click "Generate New Key"
4. Name your key and set permissions
5. Copy and store the key securely

**Note**: API keys are shown only once. Store them securely.

## Rate Limiting

- **Default**: 100 requests per 15 minutes
- **Custom**: Contact support for higher limits
- Rate limit info in response headers:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1640000000
  ```

## Endpoints

### Services

#### List Services

Get all available services.

```http
GET /api/v1/services
```

**Query Parameters:**
- `category` (optional): Filter by category (e.g., "Instagram")
- `active` (optional): Filter by active status (true/false)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "service_123",
      "name": "Instagram Followers - High Quality",
      "category": "Instagram",
      "description": "Real and active Instagram followers",
      "price": 0.60,
      "currency": "USD",
      "minQuantity": 100,
      "maxQuantity": 10000,
      "speed": "1-2 hours",
      "tags": ["followers", "instagram", "real"]
    }
  ]
}
```

#### Get Service

Get details of a specific service.

```http
GET /api/v1/services/:serviceId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "service_123",
    "name": "Instagram Followers - High Quality",
    "category": "Instagram",
    "description": "Real and active Instagram followers with profile pictures",
    "price": 0.60,
    "currency": "USD",
    "minQuantity": 100,
    "maxQuantity": 10000,
    "speed": "1-2 hours",
    "averageTime": "90 minutes",
    "refillEnabled": true,
    "subscriptionCapable": false,
    "tags": ["followers", "instagram", "real"]
  }
}
```

### Orders

#### Create Order

Create a new service order.

```http
POST /api/v1/orders
Content-Type: application/json
```

**Request Body:**

```json
{
  "service_id": "service_123",
  "link": "https://instagram.com/username",
  "quantity": 1000
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "order_id": "order_456",
    "service_id": "service_123",
    "link": "https://instagram.com/username",
    "quantity": 1000,
    "status": "pending",
    "charge": 600.00,
    "currency": "USD",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Your wallet balance is insufficient"
  }
}
```

#### Create Multiple Orders

Create multiple orders in one request.

```http
POST /api/v1/orders/bulk
Content-Type: application/json
```

**Request Body:**

```json
{
  "orders": [
    {
      "service_id": "service_123",
      "link": "https://instagram.com/user1",
      "quantity": 1000
    },
    {
      "service_id": "service_456",
      "link": "https://instagram.com/user2",
      "quantity": 500
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "created": 2,
    "failed": 0,
    "orders": [
      {
        "order_id": "order_789",
        "status": "pending"
      },
      {
        "order_id": "order_790",
        "status": "pending"
      }
    ]
  }
}
```

#### Get Order Status

Get the status of an order.

```http
GET /api/v1/orders/:orderId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "order_id": "order_456",
    "service_id": "service_123",
    "status": "completed",
    "link": "https://instagram.com/username",
    "quantity": 1000,
    "start_count": 5000,
    "remains": 0,
    "charge": 600.00,
    "currency": "USD",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T12:00:00Z",
    "completed_at": "2024-01-15T12:00:00Z"
  }
}
```

**Order Statuses:**
- `pending`: Order is queued
- `processing`: Order is being processed
- `partial`: Partially completed
- `completed`: Fully completed
- `canceled`: Canceled by user or admin
- `refunded`: Refunded to user

#### List Orders

Get all orders for your account.

```http
GET /api/v1/orders
```

**Query Parameters:**
- `status` (optional): Filter by status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (max: 100, default: 20)

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### Balance

#### Get Balance

Get your current wallet balance.

```http
GET /api/v1/balance
```

**Response:**

```json
{
  "success": true,
  "data": {
    "balance": 1250.50,
    "currency": "USD"
  }
}
```

### Subscriptions

#### Create Subscription

Create a recurring service order.

```http
POST /api/v1/subscriptions
Content-Type: application/json
```

**Request Body:**

```json
{
  "service_id": "service_123",
  "link": "https://instagram.com/username",
  "quantity": 1000,
  "interval": "daily"
}
```

**Intervals:**
- `hourly`: Every hour
- `daily`: Every day
- `weekly`: Every week
- `monthly`: Every month
- `custom`: Custom cron schedule (contact support)

**Response:**

```json
{
  "success": true,
  "data": {
    "subscription_id": "sub_789",
    "service_id": "service_123",
    "status": "active",
    "interval": "daily",
    "next_run": "2024-01-16T10:30:00Z"
  }
}
```

#### Cancel Subscription

Cancel a recurring subscription.

```http
DELETE /api/v1/subscriptions/:subscriptionId
```

**Response:**

```json
{
  "success": true,
  "message": "Subscription canceled successfully"
}
```

### Refills

#### Request Refill

Request a refill for a partial order.

```http
POST /api/v1/refills
Content-Type: application/json
```

**Request Body:**

```json
{
  "order_id": "order_456"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "refill_id": "refill_123",
    "order_id": "order_456",
    "status": "pending"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_API_KEY` | API key is invalid or expired |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INSUFFICIENT_BALANCE` | Not enough wallet balance |
| `SERVICE_NOT_FOUND` | Service doesn't exist |
| `INVALID_QUANTITY` | Quantity out of range |
| `INVALID_LINK` | Invalid or malformed link |
| `ORDER_NOT_FOUND` | Order doesn't exist |
| `SERVER_ERROR` | Internal server error |

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## Code Examples

### PHP

```php
<?php
$apiKey = 'your-api-key';
$baseUrl = 'https://your-domain.com/api/v1';

function createOrder($apiKey, $baseUrl, $serviceId, $link, $quantity) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $baseUrl . '/orders');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'service_id' => $serviceId,
        'link' => $link,
        'quantity' => $quantity
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-API-Key: ' . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

$result = createOrder($apiKey, $baseUrl, 'service_123', 'https://instagram.com/username', 1000);
print_r($result);
?>
```

### Python

```python
import requests

api_key = 'your-api-key'
base_url = 'https://your-domain.com/api/v1'

def create_order(service_id, link, quantity):
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': api_key
    }
    
    data = {
        'service_id': service_id,
        'link': link,
        'quantity': quantity
    }
    
    response = requests.post(f'{base_url}/orders', json=data, headers=headers)
    return response.json()

result = create_order('service_123', 'https://instagram.com/username', 1000)
print(result)
```

### JavaScript

```javascript
const apiKey = 'your-api-key';
const baseUrl = 'https://your-domain.com/api/v1';

async function createOrder(serviceId, link, quantity) {
  const response = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify({
      service_id: serviceId,
      link: link,
      quantity: quantity
    })
  });
  
  return await response.json();
}

createOrder('service_123', 'https://instagram.com/username', 1000)
  .then(result => console.log(result));
```

## Webhooks

Receive real-time notifications for order updates.

### Setup

1. Navigate to Settings → Webhooks
2. Add your webhook URL
3. Select events to receive
4. Save configuration

### Events

- `order.created`: Order created
- `order.processing`: Order started processing
- `order.completed`: Order completed
- `order.partial`: Order partially completed
- `order.refunded`: Order refunded
- `payment.completed`: Payment completed

### Payload

```json
{
  "event": "order.completed",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "order_id": "order_456",
    "status": "completed",
    "service_id": "service_123"
  }
}
```

### Verification

Verify webhook signatures:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return hash === signature;
}
```

## Support

- Email: api@smmpanel.com
- Discord: discord.gg/smmpanel
- Documentation: https://docs.smmpanel.com
