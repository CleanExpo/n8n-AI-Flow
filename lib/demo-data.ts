// Demo data for showcasing workflow generation capabilities

export const demoFiles = {
  customerData: {
    name: 'customers.csv',
    type: 'text/csv',
    content: `name,email,company,status,created_date
John Doe,john@example.com,Acme Corp,active,2024-01-15
Jane Smith,jane@techco.com,Tech Co,active,2024-01-20
Bob Johnson,bob@startup.io,Startup Inc,pending,2024-02-01
Alice Brown,alice@enterprise.com,Enterprise Ltd,active,2024-02-10
Charlie Wilson,charlie@demo.com,Demo Company,inactive,2024-02-15
Diana Prince,diana@heroics.com,Heroics LLC,active,2024-03-01
Eve Anderson,eve@cyber.net,Cyber Solutions,pending,2024-03-05
Frank Miller,frank@creative.design,Creative Studios,active,2024-03-10`
  },
  
  salesReport: {
    name: 'sales_report.json',
    type: 'application/json',
    content: JSON.stringify({
      report: {
        date: '2024-03-15',
        summary: {
          total_sales: 125000,
          total_orders: 342,
          average_order_value: 365.50,
          top_products: [
            { name: 'Product A', sales: 45000, units: 120 },
            { name: 'Product B', sales: 38000, units: 95 },
            { name: 'Product C', sales: 42000, units: 127 }
          ]
        },
        regions: {
          north: { sales: 45000, growth: 12.5 },
          south: { sales: 35000, growth: 8.3 },
          east: { sales: 25000, growth: 15.2 },
          west: { sales: 20000, growth: 5.7 }
        },
        alerts: [
          { type: 'high_performance', message: 'North region exceeded target by 20%' },
          { type: 'low_stock', message: 'Product C inventory below threshold' }
        ]
      }
    }, null, 2)
  },

  apiSpecification: {
    name: 'api_spec.yaml',
    type: 'text/yaml',
    content: `openapi: 3.0.0
info:
  title: User Management API
  version: 1.0.0
paths:
  /users:
    get:
      summary: List all users
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
    post:
      summary: Create new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                email:
                  type: string
  /users/{id}:
    get:
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
    put:
      summary: Update user
    delete:
      summary: Delete user`
  },

  projectRequirements: {
    name: 'requirements.md',
    type: 'text/markdown',
    content: `# Project Requirements

## Overview
Build an automated workflow system that handles customer onboarding.

## Requirements

### 1. Email Monitoring
- Monitor inbox for new customer registrations
- Identify emails with subject "New Customer Registration"
- Extract customer details from email body

### 2. Data Validation
- Validate email format
- Check for duplicate customers in database
- Verify company information

### 3. CRM Integration
- Create new contact in Salesforce
- Assign to appropriate sales team
- Set follow-up tasks

### 4. Notifications
- Send welcome email to customer
- Notify sales team via Slack
- Create calendar event for onboarding call

### 5. Reporting
- Log all activities to database
- Generate daily summary report
- Track conversion metrics

## Technical Requirements
- Must handle 100+ registrations per day
- Response time < 5 minutes
- Error handling and retry logic
- Audit trail for compliance`
  },

  invoiceTemplate: {
    name: 'invoice_template.html',
    type: 'text/html',
    content: `<!DOCTYPE html>
<html>
<head>
    <title>Invoice #{{invoice_number}}</title>
    <style>
        body { font-family: Arial, sans-serif; }
        .header { background: #f0f0f0; padding: 20px; }
        .invoice-details { margin: 20px 0; }
        .items-table { width: 100%; border-collapse: collapse; }
        .items-table th, .items-table td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
        }
        .total { font-weight: bold; font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Invoice #{{invoice_number}}</h1>
        <p>Date: {{date}}</p>
    </div>
    
    <div class="invoice-details">
        <h2>Bill To:</h2>
        <p>{{customer_name}}<br>
        {{customer_email}}<br>
        {{customer_address}}</p>
    </div>
    
    <table class="items-table">
        <thead>
            <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            {{#each items}}
            <tr>
                <td>{{description}}</td>
                <td>{{quantity}}</td>
                <td>\${{price}}</td>
                <td>\${{total}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    
    <div class="total">
        Total: \${{total_amount}}
    </div>
</body>
</html>`
  },

  pythonScript: {
    name: 'data_processor.py',
    type: 'text/x-python',
    content: `import pandas as pd
import requests
from datetime import datetime
import json

class DataProcessor:
    """Process and transform data for workflow automation"""
    
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.example.com"
        
    def fetch_data(self, endpoint):
        """Fetch data from API endpoint"""
        headers = {"Authorization": f"Bearer {self.api_key}"}
        response = requests.get(f"{self.base_url}/{endpoint}", headers=headers)
        return response.json()
    
    def process_csv(self, file_path):
        """Process CSV file and return cleaned data"""
        df = pd.read_csv(file_path)
        
        # Clean email addresses
        df['email'] = df['email'].str.lower().str.strip()
        
        # Add timestamp
        df['processed_at'] = datetime.now()
        
        # Filter active records
        active_df = df[df['status'] == 'active']
        
        return active_df.to_dict('records')
    
    def send_to_webhook(self, data, webhook_url):
        """Send processed data to webhook"""
        payload = {
            "timestamp": datetime.now().isoformat(),
            "data": data,
            "source": "data_processor"
        }
        
        response = requests.post(webhook_url, json=payload)
        return response.status_code == 200
    
    def generate_report(self, data):
        """Generate summary report from processed data"""
        report = {
            "total_records": len(data),
            "processing_date": datetime.now().isoformat(),
            "summary": {
                "by_status": {},
                "by_company": {}
            }
        }
        
        # Aggregate data
        for record in data:
            status = record.get('status', 'unknown')
            company = record.get('company', 'unknown')
            
            report['summary']['by_status'][status] = \
                report['summary']['by_status'].get(status, 0) + 1
            report['summary']['by_company'][company] = \
                report['summary']['by_company'].get(company, 0) + 1
        
        return report

# Example usage
if __name__ == "__main__":
    processor = DataProcessor("your-api-key")
    
    # Process CSV
    data = processor.process_csv("customers.csv")
    
    # Send to webhook
    processor.send_to_webhook(data, "https://n8n.example.com/webhook/customer-data")
    
    # Generate report
    report = processor.generate_report(data)
    print(json.dumps(report, indent=2))`
  },

  sqlQueries: {
    name: 'database_queries.sql',
    type: 'application/sql',
    content: `-- Customer Analytics Queries

-- Daily new customers
SELECT 
    DATE(created_date) as date,
    COUNT(*) as new_customers,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_customers
FROM customers
WHERE created_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_date)
ORDER BY date DESC;

-- Top customers by revenue
SELECT 
    c.name,
    c.email,
    c.company,
    SUM(o.total_amount) as total_revenue,
    COUNT(o.id) as order_count,
    AVG(o.total_amount) as avg_order_value
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.created_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY c.id, c.name, c.email, c.company
ORDER BY total_revenue DESC
LIMIT 10;

-- Churn risk detection
SELECT 
    c.id,
    c.name,
    c.email,
    c.last_order_date,
    CURRENT_DATE - c.last_order_date as days_since_last_order
FROM (
    SELECT 
        c.*,
        MAX(o.created_date) as last_order_date
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    GROUP BY c.id
) c
WHERE CURRENT_DATE - c.last_order_date > 60
    OR c.last_order_date IS NULL;

-- Product performance
SELECT 
    p.name as product_name,
    p.category,
    COUNT(DISTINCT oi.order_id) as order_count,
    SUM(oi.quantity) as units_sold,
    SUM(oi.quantity * oi.price) as total_revenue
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.created_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.name, p.category
ORDER BY total_revenue DESC;`
  }
};

export const demoPrompts = [
  {
    category: 'Email Automation',
    prompts: [
      'Monitor Gmail for urgent emails and forward to Slack',
      'Send weekly digest of unread emails to my phone',
      'Auto-reply to customer support emails with acknowledgment',
      'Archive emails older than 30 days to Google Drive'
    ]
  },
  {
    category: 'Data Processing',
    prompts: [
      'Process CSV files and import into PostgreSQL database',
      'Sync data between Google Sheets and Airtable every hour',
      'Transform JSON data and send to multiple APIs',
      'Validate and clean customer data before importing'
    ]
  },
  {
    category: 'Social Media',
    prompts: [
      'Post blog updates to Twitter, LinkedIn, and Facebook',
      'Monitor mentions and send notifications to Slack',
      'Schedule posts across all platforms from spreadsheet',
      'Download analytics and create monthly reports'
    ]
  },
  {
    category: 'DevOps',
    prompts: [
      'Deploy code when tests pass on GitHub pull request',
      'Monitor server health and alert on anomalies',
      'Backup databases daily to cloud storage',
      'Run security scans and email reports weekly'
    ]
  },
  {
    category: 'AI & Machine Learning',
    prompts: [
      'Extract text from images and create searchable database',
      'Transcribe voice memos and create task list',
      'Analyze sentiment in customer feedback and categorize',
      'Generate summaries from long documents'
    ]
  },
  {
    category: 'E-commerce',
    prompts: [
      'Process orders from Shopify and update inventory',
      'Send abandoned cart reminders after 24 hours',
      'Generate invoices and email to customers',
      'Sync products between WooCommerce and warehouse system'
    ]
  }
];

export const workflowTemplates = {
  emailToSlack: {
    nodes: [
      {
        id: 'node_0',
        type: 'n8n-nodes-base.gmailTrigger',
        name: 'Gmail Trigger',
        position: [250, 300],
        parameters: {
          pollTimes: { item: [{ mode: 'everyMinute' }] },
          options: {}
        }
      },
      {
        id: 'node_1',
        type: 'n8n-nodes-base.if',
        name: 'Check for Urgent',
        position: [450, 300],
        parameters: {
          conditions: {
            string: [{
              value1: '={{$json["subject"]}}',
              operation: 'contains',
              value2: 'urgent'
            }]
          }
        }
      },
      {
        id: 'node_2',
        type: 'n8n-nodes-base.slack',
        name: 'Send to Slack',
        position: [650, 300],
        parameters: {
          channel: '#alerts',
          text: '=Urgent Email: {{$json["subject"]}}\nFrom: {{$json["from"]}}\n\n{{$json["text"]}}'
        }
      }
    ],
    connections: [
      { source: 'node_0', target: 'node_1' },
      { source: 'node_1', sourceHandle: 'true', target: 'node_2' }
    ]
  },
  
  dataETL: {
    nodes: [
      {
        id: 'node_0',
        type: 'n8n-nodes-base.readBinaryFiles',
        name: 'Read CSV File',
        position: [250, 300],
        parameters: {
          filePath: '/data/customers.csv'
        }
      },
      {
        id: 'node_1',
        type: 'n8n-nodes-base.spreadsheetFile',
        name: 'Parse CSV',
        position: [450, 300],
        parameters: {
          operation: 'fromFile',
          options: {}
        }
      },
      {
        id: 'node_2',
        type: 'n8n-nodes-base.function',
        name: 'Validate Data',
        position: [650, 300],
        parameters: {
          functionCode: `// Validate email addresses
return items.filter(item => {
  const email = item.json.email;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
});`
        }
      },
      {
        id: 'node_3',
        type: 'n8n-nodes-base.postgres',
        name: 'Insert to Database',
        position: [850, 300],
        parameters: {
          operation: 'insert',
          table: 'customers',
          columns: 'name,email,company'
        }
      }
    ],
    connections: [
      { source: 'node_0', target: 'node_1' },
      { source: 'node_1', target: 'node_2' },
      { source: 'node_2', target: 'node_3' }
    ]
  }
};