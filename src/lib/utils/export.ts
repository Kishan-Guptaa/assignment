/**
 * Helper to download structured data as CSV (Excel compatible)
 */
export function exportToCSV(data: Array<Record<string, any>>, filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header];
          // Escape quotes and commas
          const escaped = ("" + (val === null || val === undefined ? "" : val)).replace(/"/g, '\\"');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ];

  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Helper to print an Order Invoice as a PDF using high-fidelity styling
 */
export function printInvoice(order: any, customerName: string, itemsDetails: Array<{ name: string; sku: string; qty: number; unit: string; price: number; total: number }>) {
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) return;

  const itemsHtml = itemsDetails
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 600; color: #0f172a;">${item.name}</div>
          <div style="font-size: 11px; color: #64748b;">SKU: ${item.sku}</div>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">
          ${item.qty} ${item.unit}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">
          ₹${item.price.toFixed(2)}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; font-family: monospace;">
          ₹${item.total.toFixed(2)}
        </td>
      </tr>
    `
    )
    .join("");

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice #${order.id} - AasaMedChem</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #0f172a;
            line-height: 1.5;
            padding: 40px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .brand {
            font-size: 24px;
            font-weight: 800;
            color: #6d28d9;
          }
          .invoice-title {
            font-size: 24px;
            font-weight: 700;
            text-align: right;
          }
          .details-grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            font-size: 14px;
          }
          .details-col {
            width: 48%;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 14px;
          }
          .table th {
            background-color: #f8fafc;
            padding: 12px 8px;
            font-weight: 600;
            text-align: left;
            border-bottom: 2px solid #e2e8f0;
          }
          .summary {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
            font-size: 15px;
          }
          .summary-table {
            width: 300px;
            border-collapse: collapse;
          }
          .summary-table td {
            padding: 8px 0;
          }
          .total-row {
            font-size: 18px;
            font-weight: 800;
            color: #6d28d9;
            border-top: 2px solid #e2e8f0;
          }
          .footer {
            margin-top: 60px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            font-size: 11px;
            color: #64748b;
            text-align: center;
          }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="max-width: 800px; margin: 0 auto;">
          <div class="header">
            <div>
              <div class="brand">AasaMedChem</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Premium Chemical Inventory & Quotations</div>
            </div>
            <div>
              <div class="invoice-title">INVOICE</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px; text-align: right;">Order ID: #${order.id}</div>
            </div>
          </div>

          <div class="details-grid">
            <div class="details-col">
              <div style="font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">Billed To:</div>
              <div style="font-weight: 600; font-size: 16px;">${customerName}</div>
              <div style="color: #64748b; margin-top: 2px;">Registered Lab Account</div>
            </div>
            <div class="details-col" style="text-align: right;">
              <div style="font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">Invoice Details:</div>
              <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
              <div><strong>Status:</strong> <span style="text-transform: uppercase; font-weight: 600; color: #059669;">${order.status}</span></div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Chemical Description</th>
                <th style="text-align: right;">Quantity</th>
                <th style="text-align: right;">Unit Rate</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary">
            <table class="summary-table">
              <tr>
                <td style="color: #64748b;">Subtotal:</td>
                <td style="text-align: right; font-family: monospace;">₹${order.totalAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #64748b;">Shipping & Handling:</td>
                <td style="text-align: right; font-family: monospace;">₹0.00</td>
              </tr>
              <tr class="total-row">
                <td style="padding-top: 12px;">Grand Total:</td>
                <td style="text-align: right; padding-top: 12px; font-family: monospace;">₹${order.totalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for choosing AasaMedChem. For support, please contact admin@aasamedchem.com.</p>
            <p style="margin-top: 8px;">AasaMedChem IMS &bull; Automated Document Distribution System</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
}
