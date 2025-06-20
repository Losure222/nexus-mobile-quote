
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
          card.className = "part-card";
          card.innerHTML = `
            <div class="part-header">${part.part_number} - ${part.manufacturer}</div>
            <div class="part-subtext">
              ${part.condition || 'N/A'}<br>
              Price: $${part.price || 'N/A'}<br>
              Vendor: ${part.vendor || 'N/A'} (${part.location || 'N/A'})<br>
              Lead Time: ${part.lead_time || 'N/A'}
            </div>
            <button onclick='selectPart(${JSON.stringify(part)})'>Add</button>
          `;
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
    <strong>${part.part_number}</strong><br>
    ${part.manufacturer} - ${part.condition || 'N/A'}<br>
    Price: $${part.price || 'N/A'}<br>
    Lead Time: ${part.lead_time || 'N/A'}
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

  const newItem = {
    ...selectedPart,
    quantity: qty,
    price: price,
    lead_time: lead,
    condition: cond
  };
  quoteItems.push(newItem);
  selectedPart = null;
  document.getElementById("quoteFormContainer").style.display = "none";
  updateQuoteBuilder();
}

function removeFromQuote(index) {
  quoteItems.splice(index, 1);
  updateQuoteBuilder();
}

function updateQuoteBuilder() {
  const quoteDiv = document.getElementById("quoteItems");
  const summaryDiv = document.getElementById("quoteSummary");
  quoteDiv.innerHTML = "";
  let subtotal = 0;

  quoteItems.forEach((item, index) => {
    const lineTotal = item.price * item.quantity;
    const div = document.createElement("div");
    div.className = "quote-item";
    div.innerHTML = `
      <strong>${item.part_number}</strong> - ${item.manufacturer}<br>
      Qty: ${item.quantity}, Unit: $${item.price.toFixed(2)}, Total: $${lineTotal.toFixed(2)}<br>
      Lead Time: ${item.lead_time || 'N/A'} | Condition: ${item.condition || 'N/A'}
      <br><button onclick="removeFromQuote(${index})">Remove</button>
    `;
    subtotal += lineTotal;
    quoteDiv.appendChild(div);
  });

  // Calculate final total
  const shipping = parseFloat(document.getElementById("shippingCost").value) || 0;
  const discount = parseFloat(document.getElementById("discountPercent").value) || 0;
  const discountAmt = subtotal * (discount / 100);
  const total = subtotal - discountAmt + shipping;

  const customerName = document.getElementById("customerName").value;

  summaryDiv.innerHTML = `
    <hr>
    <p><strong>Customer:</strong> ${customerName || '(Not set)'}</p>
    <p>Subtotal: $${subtotal.toFixed(2)}</p>
    <p>Discount: -$${discountAmt.toFixed(2)}</p>
    <p>Shipping: $${shipping.toFixed(2)}</p>
    <h3>Total: $${total.toFixed(2)}</h3>
  `;
}


function sendQuote() {
  const email = document.getElementById("customerEmail").value;
  const subject = document.getElementById("emailSubject").value || "Quote from Stanlo Automation";
  const cc = "jack@stanloautomation.com";
  const customer = document.getElementById("customerName").value;
  const shipping = parseFloat(document.getElementById("shippingCost").value) || 0;
  const discount = parseFloat(document.getElementById("discountPercent").value) || 0;

  let subtotal = 0;
  let body = `Hi ${customer || 'there'},%0D%0A%0D%0AHere is your quote:%0D%0A%0D%0A`;

  quoteItems.forEach((item, index) => {
    const lineTotal = item.quantity * item.price;
    subtotal += lineTotal;
    body += `Part: ${item.part_number} - ${item.manufacturer}%0D%0A`;
    body += `Qty: ${item.quantity}, Unit: $${item.price.toFixed(2)}, Total: $${lineTotal.toFixed(2)}%0D%0A`;
    body += `Condition: ${item.condition || 'N/A'}, Lead Time: ${item.lead_time || 'N/A'}%0D%0A%0D%0A`;
  });

  const discountAmt = subtotal * (discount / 100);
  const total = subtotal - discountAmt + shipping;

  body += `Subtotal: $${subtotal.toFixed(2)}%0D%0A`;
  body += `Discount: -$${discountAmt.toFixed(2)}%0D%0A`;
  body += `Shipping: $${shipping.toFixed(2)}%0D%0A`;
  body += `Total: $${total.toFixed(2)}%0D%0A%0D%0A`;
  body += `Thank you for choosing Stanlo Automation.%0D%0A`;

  const mailtoLink = `mailto:${email}?cc=${cc}&subject=${encodeURIComponent(subject)}&body=${body}`;
  window.location.href = mailtoLink;
}
