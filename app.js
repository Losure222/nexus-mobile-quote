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
        data.csv_results.forEach((part, index) => {
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

function addManualPart() {
  const partNumber = document.getElementById("manualPartNumber").value;
  const manufacturer = document.getElementById("manualManufacturer").value;
  const quantity = parseInt(document.getElementById("manualQuantity").value) || 1;
  const price = parseFloat(document.getElementById("manualPrice").value) || 0;
  const condition = document.getElementById("manualCondition").value;
  const leadTime = document.getElementById("manualLeadTime").value;

  const manualItem = {
    part_number: partNumber,
    manufacturer: manufacturer,
    quantity: quantity,
    price: price,
    condition: condition,
    lead_time: leadTime
  };

  quoteItems.push(manualItem);
  updateQuoteBuilder();

  // Optionally clear the form
  document.getElementById("manualPartNumber").value = '';
  document.getElementById("manualManufacturer").value = '';
  document.getElementById("manualQuantity").value = 1;
  document.getElementById("manualPrice").value = '';
  document.getElementById("manualCondition").value = '';
  document.getElementById("manualLeadTime").value = '';
}

function removeFromQuote(index) {
  quoteItems.splice(index, 1);
  updateQuoteBuilder();
}

function updateQuoteBuilder() {
  const quoteDiv = document.getElementById("quoteItems");
  const summaryDiv = document.getElementById("quoteSummary");
  quoteDiv.innerHTML = "";
  let total = 0;

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
    total += lineTotal;
    quoteDiv.appendChild(div);
  });

  summaryDiv.innerHTML = `<strong>Total: $${total.toFixed(2)}</strong>`;
}

// Optional: toggle manual entry form
function showManualEntry() {
  const form = document.getElementById("manualEntryForm");
  form.style.display = form.style.display === "none" ? "block" : "none";
}
