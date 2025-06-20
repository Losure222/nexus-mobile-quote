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
  const name = document.getElementById("customerName").value || "Customer";
  const shipping = parseFloat(document.getElementById("shippingCost").value) || 0;
  const discount = parseFloat(document.getElementById("discountPercent").value) || 0;
  let subtotal = 0;

  let html = `
  <div style="font-family:Arial; padding:20px;">
    <img src='https://stanloautomation.com/wp-content/uploads/2024/11/cropped-stanlo_logo_2023-1-300x67.png' style='height:50px;' />
    <h2>Quote</h2>
    <p><strong>Account Manager:</strong> Jack West<br>
    <strong>Contact Number:</strong> 224-386-9496<br>
    <strong>Quote Date:</strong> ${new Date().toLocaleDateString()}<br>
    <strong>Valid for:</strong> 14 Days</p>

    <table border="1" cellspacing="0" cellpadding="6" style="width:100%; border-collapse: collapse; margin-top:10px;">
      <thead><tr>
        <th>Details</th><th>QTY</th><th>Condition</th><th>ETA</th><th>Unit Price</th><th>Total</th>
      </tr></thead><tbody>
  `;

  quoteItems.forEach(item => {
    const lineTotal = item.quantity * item.price;
    subtotal += lineTotal;
    html += `<tr>
      <td>${item.part_number}</td>
      <td>${item.quantity}</td>
      <td>${item.condition}</td>
      <td>${item.lead_time || "N/A"}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td>$${lineTotal.toFixed(2)}</td>
    </tr>`;
  });

  const discountAmt = subtotal * (discount / 100);
  const total = subtotal - discountAmt + shipping;

  html += `
    </tbody></table>
    <p style="margin-top:10px;">
      <strong>Subtotal:</strong> $${subtotal.toFixed(2)}<br>
      <strong>Shipping:</strong> $${shipping.toFixed(2)}<br>
      <strong>Discount:</strong> -$${discountAmt.toFixed(2)}<br>
      <strong>Total:</strong> <span style="font-size:1.3em;">$${total.toFixed(2)}</span>
    </p>
    <p style="margin-top:30px;font-size:small;color:gray;">
      We accept all major credit cards, wire transfer, and Paypal.<br>
      Parts are subject to availability at time of ordering.<br>
      Stanlo Automation standard terms and conditions of business apply.
    </p>
  </div>`;

  html2pdf().from(html).set({ filename: "Quote.pdf", html2canvas: { scale: 2 }, jsPDF: { format: 'a4' } }).save();
}
