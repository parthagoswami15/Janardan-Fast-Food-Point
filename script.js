// JANARDAN FAST FOOD POINT front-end logic
// Pure vanilla JavaScript. Handles quantity, total calculation, and WhatsApp order link.

(function () {
  "use strict";

  /**
   * Initialize quantity controls and WhatsApp order button
   */
  document.addEventListener("DOMContentLoaded", function () {
    var itemElements = Array.prototype.slice.call(
      document.querySelectorAll(".menu-item")
    );

    var totalElement = document.getElementById("order-total");
    var whatsappButton = document.getElementById("whatsapp-order-button");

    if (!itemElements.length || !totalElement || !whatsappButton) {
      // Basic safety check – if structure is missing, do nothing.
      return;
    }

    /**
     * Recalculate order total based on current quantities in the DOM.
     */
    function recalculateTotal() {
      var subtotal = 0;

      itemElements.forEach(function (item) {
        var price = parseInt(item.getAttribute("data-price"), 10) || 0;
        var qtyElement = item.querySelector(".quantity-value");
        if (!qtyElement) return;

        var qty = parseInt(qtyElement.textContent, 10) || 0;
        subtotal += price * qty;
      });

      // Delivery charge rules
      // Minimum order: ₹99 for delivery
      // If 99 <= subtotal <= 499: delivery charge ₹20
      // If subtotal >= 500: free delivery
      // Otherwise (subtotal < 99): no delivery / not allowed

      var deliveryCharge = 0;

      if (subtotal > 0 && subtotal < 99) {
        // Below minimum – keep delivery 0 but we will block in click handler.
        deliveryCharge = 0;
      } else if (subtotal >= 99 && subtotal <= 499) {
        // From ₹99 up to ₹499: flat ₹20 delivery charge.
        deliveryCharge = 20;
      } else if (subtotal >= 500) {
        // ₹500 and above: free delivery.
        deliveryCharge = 0;
      }

      var grandTotal = subtotal + deliveryCharge;
      totalElement.textContent = "₹" + grandTotal;
      return {
        subtotal: subtotal,
        deliveryCharge: deliveryCharge,
        grandTotal: grandTotal,
      };
    }

    /**
     * Attach + and − handlers for each item card.
     */
    itemElements.forEach(function (item) {
      var minusBtn = item.querySelector(".btn-qty.minus");
      var plusBtn = item.querySelector(".btn-qty.plus");
      var qtyElement = item.querySelector(".quantity-value");

      if (!minusBtn || !plusBtn || !qtyElement) {
        return;
      }

      minusBtn.addEventListener("click", function () {
        var current = parseInt(qtyElement.textContent, 10) || 0;
        if (current > 0) {
          qtyElement.textContent = String(current - 1);
          recalculateTotal();
        }
      });

      plusBtn.addEventListener("click", function () {
        var current = parseInt(qtyElement.textContent, 10) || 0;
        // You can enforce a sensible upper limit if needed.
        qtyElement.textContent = String(current + 1);
        recalculateTotal();
      });
    });

    /**
     * Build the WhatsApp order message based on selected items.
     * @returns {{message: string, subtotal: number, lines: string[]}}
     */
    function buildWhatsAppMessage() {
      var lines = [];
      var subtotal = 0;

      itemElements.forEach(function (item) {
        var name = item.getAttribute("data-name") || "Item";
        var price = parseInt(item.getAttribute("data-price"), 10) || 0;
        var qtyElement = item.querySelector(".quantity-value");
        if (!qtyElement) return;

        var qty = parseInt(qtyElement.textContent, 10) || 0;
        if (!qty) return; // Skip unselected items

        var itemTotal = price * qty;
        subtotal += itemTotal;

        lines.push("- " + name + " x " + qty + " = ₹" + itemTotal);
      });

      var header = "*JANARDAN FAST FOOD POINT*" +
        "\nPenchakura : Ajodhya";

      var body;
      var totals = recalculateTotal();

      // Configure your UPI ID here so the payment link carries the final amount.
      var upiId = "YOUR_UPI_ID@bank"; // TODO: replace with real UPI ID
      var paymentLink =
        "upi://pay?pa=" + encodeURIComponent(upiId) +
        "&am=" + encodeURIComponent(totals.grandTotal) +
        "&cu=INR" +
        "&tn=" + encodeURIComponent("Order from JANARDAN FAST FOOD POINT");

      if (lines.length) {
        body =
          "\n\nOrder details:\n" +
          lines.join("\n") +
          "\n\nSubtotal: ₹" + subtotal +
          "\nDelivery charge: ₹" + totals.deliveryCharge +
          "\nTotal payable: ₹" + totals.grandTotal +
          "\n\nDelivery address: [Your address here]" +
          "\nPayment method: COD / UPI (please specify)" +
          "\nUPI payment link (tap or copy into your UPI app): " + paymentLink;
      } else {
        body =
          "\n\nI would like to place an order. Please share today\'s menu.";
      }

      var message = header + body;
      return { message: message, subtotal: subtotal, lines: lines };
    }

    /**
     * Handle WhatsApp order button click.
     * Opens WhatsApp with a pre-filled message.
     */
    whatsappButton.addEventListener("click", function () {
      var totals = recalculateTotal();
      var payload = buildWhatsAppMessage();

      if (!payload.lines.length) {
        // Encourage the user to pick items first.
        window.alert("Please select at least one item before placing your order.");
        return;
      }

      if (totals.subtotal < 99) {
        window.alert("Minimum order amount for delivery is ₹99. Please add more items.");
        return;
      }

      var phoneNumber = "917908789954"; // Replace with restaurant's WhatsApp number
      var url =
        "https://wa.me/" +
        encodeURIComponent(phoneNumber) +
        "?text=" +
        encodeURIComponent(payload.message);

      window.open(url, "_blank");
    });
  });
})();
