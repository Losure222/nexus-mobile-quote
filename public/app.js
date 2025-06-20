let selectedPart = null;
const quoteItems = [];

function searchParts() {
  const query = document.getElementById("searchInput").value;
  fetch(`https://nexus-backend-6xfb.onrender.com/parts?query=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      const resultsDiv = document.getElementById("results");
      resultsDiv.innerHTML = "";
      if (data && data.csv_results && data.csv_results.length) {
        data.csv_results.forEach((part) => {
          const card = document.createElement("div");
          card.className = "quote-item";
          card.innerHTML = `<strong>${part.part_number}</strong> - ${part.manufacturer}<br>
          ${part.condition || 'N/A'}<br>Price: $${part.price || 'N/A'}<br>
          <button onclick='selectPart(${JSON.stringify(part)})'>Add</button>`;
          resultsDiv.appendChild(card);
        });
      } else {
        resultsDiv.innerHTML = "<p>No parts found.</p>";
      }
    });
}

function selectPart(part) {
  selectedPart = part;
  document.getElementById("quoteFormContainer").style.display = "block";
  document.getElementById("selectedPartInfo").innerHTML = `
    <strong>${part.part_number}</strong><br>${part.manufacturer} - ${part.condition || 'N/A'}
  `;
  document.getElementById("qtyInput").value = 1;
  document.getElementById("priceInput").value = part.price || 0;
  document.getElementById("leadTimeInput").value = part.lead_time || '';
  document.getElementById("conditionInput").value = part.condition || '';
}

function finalizeQuoteItem() {
  const qty = parseInt(document.getElementById("qtyInput").value) || 1;
  const price = parseFloat(document.getElementById("priceInput").value) || 0;
  const lead = document.getElementById("leadTimeInput").value;
  const cond = document.getElementById("conditionInput").value;
  const cost = parseFloat(selectedPart.price || 0);
  const profit = (price - cost) * qty;
  const margin = cost > 0 ? (((price - cost) / cost) * 100).toFixed(1) : "N/A";

  quoteItems.push({ 
    ...selectedPart, 
    quantity: qty, 
    price, 
    lead_time: lead, 
    condition: cond,
    cost,
    profit,
    margin 
  });

  selectedPart = null;
  document.getElementById("quoteFormContainer").style.display = "none";
  updateQuoteBuilder();
}

function updateQuoteBuilder() {
  const quoteDiv = document.getElementById("quoteItems");
  quoteDiv.innerHTML = "";
  let subtotal = 0;
  let totalProfit = 0;

  quoteItems.forEach((item, i) => {
  const lineTotal = item.price * item.quantity;
  subtotal += lineTotal;
  totalProfit += item.profit;

  quoteDiv.innerHTML += `
    <div class="quote-item">
      <strong>${item.part_number}</strong> - ${item.manufacturer}<br>
      Qty: ${item.quantity}, $${item.price.toFixed(2)} ea → $${lineTotal.toFixed(2)}<br>
      Condition: ${item.condition}, Lead Time: ${item.lead_time}<br>
      <span style="color:green;">Profit: $${item.profit.toFixed(2)} (${item.margin}%)</span><br>
      <button onclick="removeFromQuote(${i})">Remove</button>
    </div>
  `;
});

  const shipping = parseFloat(document.getElementById("shippingCost").value) || 0;
  const discount = parseFloat(document.getElementById("discountPercent").value) || 0;
  const discountAmt = subtotal * (discount / 100);
  const total = subtotal - discountAmt + shipping;

  document.getElementById("quoteSummary").innerHTML = `
    <hr>
    <p>Subtotal: $${subtotal.toFixed(2)}</p>
    <p>Discount: -$${discountAmt.toFixed(2)}</p>
    <p>Shipping: $${shipping.toFixed(2)}</p>
    <h3>Total: $${total.toFixed(2)}</h3>
    <p style="color:green;">Total Profit: $${totalProfit.toFixed(2)}</p>
  `;
}

function removeFromQuote(i) {
  quoteItems.splice(i, 1);
  updateQuoteBuilder();
}

function generatePDF() {
  const customerName = document.getElementById("customerName").value || "Customer";
  const shipping = parseFloat(document.getElementById("shippingCost").value) || 0;
  const discount = parseFloat(document.getElementById("discountPercent").value) || 0;
  const quoteDate = new Date();
  const quoteNumber = Math.floor(10000 + Math.random() * 90000); // Simple 5-digit random quote #
  const validUntil = new Date();
  validUntil.setDate(quoteDate.getDate() + 14);

  let subtotal = 0;
  let html = `
  <div style="font-family: Arial, sans-serif; font-size: 12px; padding: 20px; width: 700px;">

    <table style="width:100%; margin-bottom: 20px;">
      <tr>
        <td style="width: 60%;">
          <img src="https://stanloautomation.com/wp-content/uploads/2025/03/Updated-Logo-V3.png" style="height: 50px;" />
        </td>
        <td style="text-align:right;">
          <h2 style="margin:0;">Quote # <span style="color:red;">${quoteNumber}</span></h2>
          <p style="margin: 4px 0;"><strong>Account Manager:</strong> Jack West<br>
          <strong>Contact Number:</strong> 224-386-9496<br>
          <strong>Quote Date:</strong> ${quoteDate.toLocaleDateString()}<br>
          <strong>Valid for:</strong> 14 Days<br>
          </p>
        </td>
      </tr>
    </table>

    <table border="1" cellspacing="0" cellpadding="6" style="width:100%; border-collapse: collapse; font-size: 12px;">
      <thead style="background-color:#f0f0f0;">
        <tr>
          <th style="text-align:left;">Details</th>
          <th>QTY</th>
          <th>Condition</th>
          <th>ETA</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
  `;

  quoteItems.forEach(item => {
    const lineTotal = item.quantity * item.price;
    subtotal += lineTotal;
    html += `
      <tr>
        <td>${item.manufacturer} ${item.part_number}</td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:center;">${item.condition}</td>
        <td style="text-align:center;">${item.lead_time || 'N/A'}</td>
        <td style="text-align:right;">$${item.price.toFixed(2)}</td>
        <td style="text-align:right;">$${lineTotal.toFixed(2)}</td>
      </tr>
    `;
  });

  const discountAmt = subtotal * (discount / 100);
  const total = subtotal - discountAmt + shipping;

  html += `
      </tbody>
    </table>

    <table style="width: 100%; margin-top: 20px; font-size: 12px;">
      <tr>
        <td style="width: 60%;"></td>
        <td style="width: 40%;">
          <table style="width:100%;">
            <tr><td>Subtotal:</td><td style="text-align:right;">$${subtotal.toFixed(2)}</td></tr>
            <tr><td>Shipping:</td><td style="text-align:right;">$${shipping.toFixed(2)}</td></tr>
            <tr><td>Discount:</td><td style="text-align:right;">-$${discountAmt.toFixed(2)}</td></tr>
            <tr><td><strong>Total (USD):</strong></td><td style="text-align:right;"><strong>$${total.toFixed(2)}</strong></td></tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin-top: 40px; font-size:10px; color:gray;">
      We accept all major credit cards, wire transfer, and PayPal.<br>
      Parts are subject to availability at time of ordering.<br>
      Stanlo Automation standard terms and conditions of business apply.
    </p>
  </div>
  `;

  html2pdf().from(html).set({
    filename: `Stanlo_Quote_${quoteNumber}.pdf`,
    html2canvas: { scale: 2 },
    jsPDF: { format: 'a4', orientation: 'portrait' }
  }).save();
}
