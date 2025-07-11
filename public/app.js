let selectedPart = null;
const quoteItems = [];

function searchParts() {
  const rawQuery = document.getElementById("searchInput").value;
  const normalizedQuery = rawQuery.toLowerCase().replace(/[\s\-]/g, '');

  fetch(`https://nexus-backend-6xfb.onrender.com/parts?query=${encodeURIComponent(normalizedQuery)}`)
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
    })
    .catch(err => console.error("Error:", err));
    
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
      </div>
    `;
  });

  const shipping = parseFloat(document.getElementById("shippingCost").value) || 0;
  const discount = parseFloat(document.getElementById("discountPercent").value) || 0;
  const tariff = parseFloat(document.getElementById("tariffFee").value) || 0;

  const discountAmt = subtotal * (discount / 100);
  const total = subtotal - discountAmt + shipping + tariff;

  document.getElementById("quoteSummary").innerHTML = `
    <hr>
    <p>Subtotal: $${subtotal.toFixed(2)}</p>
    <p>Discount: -$${discountAmt.toFixed(2)}</p>
    <p>Shipping: $${shipping.toFixed(2)}</p>
    <p>Tariff Fee: $${tariff.toFixed(2)}</p>
    <h3>Total: $${total.toFixed(2)}</h3>
    <p style="color:green;">Total Profit: $${totalProfit.toFixed(2)}</p>
  `;
}

function generatePDF() {
  const customerName = document.getElementById("customerName").value || "Customer";
  const shipping = parseFloat(document.getElementById("shippingCost").value) || 0;
  const discount = parseFloat(document.getElementById("discountPercent").value) || 0;
  const quoteDate = new Date();
  const quoteNumber = Math.floor(10000 + Math.random() * 90000);
  const validUntil = new Date();
  validUntil.setDate(quoteDate.getDate() + 14);

  let subtotal = 0;
  let html = `
    <div style="font-family: Arial, sans-serif; font-size: 12px; padding: 20px; width: 700px;">
      <table style="width:100%; margin-bottom: 20px;">
        <tr>
          <td style="width: 60%;">
            <img x;">
          </td>
          <td style="text-align:right;">
            <h2 style="margin:0;">Quote # <span style="color:red;">${quoteNumber}</span></h2>
            <p>Account Manager: Jack West<br>
            Quote Date: ${quoteDate.toLocaleDateString()}<br>
            Valid for: 14 Days<br>
            Customer: ${customerName}</p>
          </td>
        </tr>
      </table>

      <table style="width:100%; border-collapse: collapse;" border="1" cellspacing="0" cellpadding="5">
        <thead style="background-color:#f0f0f0;">
          <tr>
            <th>Manufacturer</th><th>Part Number</th><th>QTY</th><th>Condition</th><th>ETA</th><th>Unit Price</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
  `;

  quoteItems.forEach(item => {
    const lineTotal = item.quantity * item.price;
    subtotal += lineTotal;
    html += `
      <tr>
        <td>${item.manufacturer}</td>
        <td>${item.part_number}</td>
        <td>${item.quantity}</td>
        <td>${item.condition}</td>
        <td>${item.lead_time || 'N/A'}</td>
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

      <table style="width:100%; margin-top: 20px;">
        <tr><td style="width:60%;"></td>
          <td>
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

  html2pdf().from(html).outputPdf('blob').then(blob => {
    const file = new File([blob], `Stanlo_Quote_${quoteNumber}.pdf`, { type: "application/pdf" });

    const shareText = `Hi ${customerName || 'there'},\n\nYour quote is attached in the PDF below. Let me know if you'd like to get this order moving or if you need anything else.\n\nBest regards,`;
    const shareTitle = `Stanlo Automation Quote #${quoteNumber}`;

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        title: shareTitle, // Subject
        text: shareText,   // Body
        files: [file]
      }).catch(err => {
        alert("Sharing cancelled or failed.");
        console.error(err);
      });
    } else {
      // Fallback for unsupported devices
      html2pdf().from(html).set({
        filename: `Stanlo_Quote_${quoteNumber}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { format: 'a4', orientation: 'portrait' }
      }).save();
    }
  });
}

function showManualPartForm() {
  const form = document.getElementById("manualPartForm");
  form.style.display = (form.style.display === "none" || form.style.display === "") ? "block" : "none";
}

function submitManualPart() {
  const part = {
    part_number: document.getElementById("manualPartNumber").value || "Manual Entry",
    manufacturer: document.getElementById("manualManufacturer").value || "Unknown",
    price: parseFloat(document.getElementById("manualPrice").value) || 0,
    condition: document.getElementById("manualCondition").value || 'N/A',
    lead_time: document.getElementById("manualLeadTime").value || 'N/A'
  };

  const qty = parseInt(document.getElementById("manualQuantity").value) || 1;
  selectPart(part);
  document.getElementById("qtyInput").value = qty;

  document.getElementById("manualPartForm").style.display = "none";
}


// Helper to calculate total quote value
function calculateQuoteTotal() {
  const subtotal = quoteItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = parseFloat(document.getElementById("shippingCost").value) || 0;
  const discount = parseFloat(document.getElementById("discountPercent").value) || 0;
  const tariff = parseFloat(document.getElementById("tariffFee")?.value || 0);
  const discountAmt = subtotal * (discount / 100);
  return subtotal - discountAmt + shipping + tariff;
}

function sendStripePaymentLink() {
  const customerName = document.getElementById("customerName").value || "Customer";

  const subtotal = quoteItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = parseFloat(document.getElementById("shippingCost").value) || 0;
  const discount = parseFloat(document.getElementById("discountPercent").value) || 0;
  const tariff = parseFloat(document.getElementById("tariffFee")?.value || 0);

  const discountAmt = subtotal * (discount / 100);
  const total = subtotal - discountAmt + shipping + tariff;

  fetch("https://nexus-backend-6xfb.onrender.com/create-payment-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: customerName,
      amount: parseFloat(total.toFixed(2))
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.url) {
        const body = `Hi ${customerName},

Thanks again for your order.

💳 You can securely complete payment at the link below:
${data.url}

Once payment is made, we’ll begin processing and send confirmation.

Let me know if you have any questions.

— Stanlo Automation`;

        const subject = encodeURIComponent("Stanlo Automation – Payment Link");
        const mailBody = encodeURIComponent(body);

        window.location.href = `mailto:?subject=${subject}&body=${mailBody}`;
      } else {
        alert("Error: could not create payment link.");
      }
    })
    .catch(err => {
      console.error("Stripe error:", err);
      alert("Failed to send payment link.");
    });
}