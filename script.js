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
    var orderDetailsModal = document.getElementById("order-details-modal");
    var orderDetailsForm = document.getElementById("order-details-form");
    var orderDetailsCancel = document.getElementById("order-details-cancel");
    var inputName = document.getElementById("customer-name");
    var inputPhone = document.getElementById("customer-phone");
    var inputAddress = document.getElementById("customer-address");
    var inputNearby = document.getElementById("customer-nearby");
    var upiIdTextElement = document.getElementById("upi-id-text");
    var upiAmountElement = document.getElementById("upi-amount-text");
    var upiPayButton = document.getElementById("upi-pay-button");
    var UPI_ID = "7074614061.etb@icici";
    var hasAttemptedUpiPayment = false;
    var currentOfferAlertKey = null;
    var upiProofRow = document.getElementById("upi-proof-row");
    var upiProofInput = document.getElementById("upi-proof");
    var currentDaySlug = (function () {
      var dayIndex = new Date().getDay();
      var days = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"
      ];
      return days[dayIndex] || "";
    })();

    if (!itemElements.length || !totalElement || !whatsappButton) {
      // Basic safety check – if structure is missing, do nothing.
      return;
    }

    if (upiIdTextElement) {
      upiIdTextElement.textContent = UPI_ID;
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

    var paymentMethodInputs = document.querySelectorAll('input[name="payment-method"]');
    paymentMethodInputs.forEach(function (input) {
      input.addEventListener("change", function () {
        syncUpiProofVisibility();
      });
    });

    syncUpiProofVisibility();

      // Delivery is free once minimum order is met. Calculate promotional discounts.
      var deliveryCharge = 0;
      var discount = 0;

      if (subtotal > 500) {
        discount = 50;
      } else if (subtotal > 300) {
        discount = 20;
      }

      var grandTotal = Math.max(subtotal + deliveryCharge - discount, 0);
      totalElement.textContent = "₹" + grandTotal;

      if (upiAmountElement) {
        upiAmountElement.textContent = "₹" + grandTotal;
      }
      return {
        subtotal: subtotal,
        deliveryCharge: deliveryCharge,
        discount: discount,
        grandTotal: grandTotal,
      };
    }

    function getOfferKey(totals) {
      if (!totals) return null;
      return [totals.subtotal, totals.discount].join(":");
    }

    function maybeShowOfferAlert(totals) {
      if (!totals) return;
      var hasDiscount = totals.discount > 0;
      var qualifiesFreeDrink = totals.subtotal > 500;

      if (!hasDiscount && !qualifiesFreeDrink) {
        currentOfferAlertKey = null;
        return;
      }

      var offerKey = getOfferKey(totals);
      if (offerKey && offerKey === currentOfferAlertKey) {
        return;
      }
      currentOfferAlertKey = offerKey;

      var messageParts = [];
      if (totals.subtotal > 500) {
        messageParts.push(
          "Offer unlocked: ₹50 OFF on orders above ₹500! Your payable total already includes this discount."
        );
        messageParts.push(
          "You just WON a FREE cold drink for being today's first ₹500+ delivery customer (subject to availability) – mention it on WhatsApp when sharing your order!"
        );
      } else if (totals.subtotal > 300) {
        messageParts.push(
          "Offer unlocked: ₹20 OFF on orders above ₹300! Your payable total already includes this discount."
        );
      }

      if (messageParts.length) {
        window.alert(messageParts.join("\n\n"));
      }
    }

    function createUpiPaymentLink(amount) {
      var finalAmount = amount;
      if (typeof finalAmount !== "number") {
        var totalsForLink = recalculateTotal();
        finalAmount = totalsForLink.grandTotal;
      }

      return (
        "upi://pay?pa=" +
        encodeURIComponent(UPI_ID) +
        "&pn=" +
        encodeURIComponent("JANARDAN FAST FOOD POINT") +
        "&am=" +
        encodeURIComponent(finalAmount) +
        "&cu=INR" +
        "&tn=" +
        encodeURIComponent("Order from JANARDAN FAST FOOD POINT")
      );
    }

    function isMobileDevice() {
      var ua = navigator.userAgent || "";
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    }

    function getSelectedPaymentMethod() {
      var selected = document.querySelector('input[name="payment-method"]:checked');
      if (!selected) {
        return "COD";
      }
      var value = (selected.value || "").toUpperCase();
      if (value === "UPI") {
        return "UPI";
      }
      return "COD";
    }

    function syncUpiProofVisibility() {
      if (!upiProofRow) return;
      var method = getSelectedPaymentMethod();
      if (method === "UPI") {
        upiProofRow.classList.add("is-visible");
      } else {
        upiProofRow.classList.remove("is-visible");
        if (upiProofInput) {
          upiProofInput.value = "";
        }
      }
    }

    function openOrderDetailsModal() {
      if (!orderDetailsModal) {
        return;
      }
      orderDetailsModal.classList.add("is-open");
      orderDetailsModal.setAttribute("aria-hidden", "false");
      if (inputPhone) {
        inputPhone.focus();
      }
    }

    function closeOrderDetailsModal() {
      if (!orderDetailsModal) {
        return;
      }
      orderDetailsModal.classList.remove("is-open");
      orderDetailsModal.setAttribute("aria-hidden", "true");
    }

    /**
     * Attach + and − handlers for each item card.
     */
    itemElements.forEach(function (item) {
      var minusBtn = item.querySelector(".btn-qty.minus");
      var plusBtn = item.querySelector(".btn-qty.plus");
      var qtyElement = item.querySelector(".quantity-value");
      var availableDay = (item.getAttribute("data-available-day") || "").toLowerCase();

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
        if (availableDay && availableDay !== currentDaySlug) {
          window.alert(
            "This item is only available on " +
              availableDay.charAt(0).toUpperCase() +
              availableDay.slice(1) +
              ". Please order it on that day."
          );
          return;
        }
        var current = parseInt(qtyElement.textContent, 10) || 0;
        // You can enforce a sensible upper limit if needed.
        qtyElement.textContent = String(current + 1);
        recalculateTotal();
      });
    });

    /**
     * Build the WhatsApp order message based on selected items.
     * @param {"COD"|"UPI"|undefined} paymentMethodValue Optional payment method selection.
     * @returns {{message: string, subtotal: number, lines: string[]}}
     */
    function buildWhatsAppMessage(paymentMethodValue) {
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
      var paymentLink = createUpiPaymentLink(totals.grandTotal);

      if (lines.length) {
        var baseSection =
          "\n\nOrder details:\n" +
          lines.join("\n") +
          "\n\nSubtotal: ₹" + subtotal +
          "\nDelivery charge: ₹" + totals.deliveryCharge;

        if (totals.discount > 0) {
          baseSection += "\nOffer discount: −₹" + totals.discount;
        }

        baseSection += "\nTotal payable: ₹" + totals.grandTotal;

        var paymentSection;
        if (paymentMethodValue === "COD") {
          paymentSection =
            "\n\nPayment method: Cash on delivery (pay to delivery partner).";
        } else if (paymentMethodValue === "UPI") {
          paymentSection =
            "\n\nPayment method: UPI (online)" +
            "\nUPI ID: " + UPI_ID;
        } else {
          paymentSection =
            "\n\nPayment options:" +
            "\n- Cash on delivery" +
            "\n- UPI to " + UPI_ID;
        }

        var offerNotes = "";
        if (totals.subtotal > 500) {
          offerNotes =
            "\n\nSpecial note: You also unlocked a free cold drink if you're today's first ₹500+ delivery customer. Mention it in WhatsApp to claim!";
        }

        body = baseSection + paymentSection + offerNotes;
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
        window.alert(
          "Sorry, we cannot take orders below ₹99 for delivery. Please add more items to continue."
        );
        return;
      }

      maybeShowOfferAlert(totals);

      if (orderDetailsModal && orderDetailsForm) {
        openOrderDetailsModal();
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

    if (orderDetailsCancel) {
      orderDetailsCancel.addEventListener("click", function () {
        closeOrderDetailsModal();
      });
    }

    if (upiPayButton) {
      upiPayButton.addEventListener("click", function () {
        var totals = recalculateTotal();
        var payload = buildWhatsAppMessage();

        if (!payload.lines.length) {
          window.alert("Please select at least one item before paying with UPI.");
          return;
        }

        if (totals.subtotal < 99) {
          window.alert(
            "Sorry, we cannot take orders below ₹99 for delivery. Please add more items before paying."
          );
          return;
        }

        if (!isMobileDevice()) {
          window.alert(
            "UPI payment link can only open in a UPI app on your phone.\n\n" +
              "Please open this page on your mobile device, or scan the QR code below with your UPI app to pay."
          );
          return;
        }

        hasAttemptedUpiPayment = true;

        var link = createUpiPaymentLink(totals.grandTotal);
        window.alert(
          "We will now open your UPI app with total ₹" +
            totals.grandTotal +
            ".\n\nAfter completing the payment, please return to this page and tap 'Continue to WhatsApp' to send your order details."
        );
        window.location.href = link;
      });
    }

    if (orderDetailsForm) {
      orderDetailsForm.addEventListener("submit", function (event) {
        event.preventDefault();

        var name = inputName ? inputName.value.trim() : "";
        var phone = inputPhone ? inputPhone.value.trim() : "";
        var address = inputAddress ? inputAddress.value.trim() : "";
        var nearby = inputNearby ? inputNearby.value.trim() : "";

        if (!phone || !address) {
          window.alert("Please enter your phone number and full address.");
          return;
        }

        var paymentMethodValue = getSelectedPaymentMethod();
        if (paymentMethodValue === "UPI" && upiProofInput && !upiProofInput.files.length) {
          window.alert("Please upload your UPI payment screenshot before submitting the order.");
          upiProofInput.focus();
          return;
        }
        var payload = buildWhatsAppMessage(paymentMethodValue);
        var paymentMethodText =
          paymentMethodValue === "UPI" ? "UPI (online)" : "Cash on delivery";

        var detailsText =
          "\n\nCustomer details:" +
          "\nName: " + (name || "[Not provided]") +
          "\nPhone: " + phone +
          "\nAddress: " + address +
          "\nNearby location: " + (nearby || "[Not provided]") +
          "\nPreferred payment: " + paymentMethodText;

        if (paymentMethodValue === "UPI") {
          detailsText +=
            "\nUPI proof: Attached in form. Please confirm after verifying the screenshot in WhatsApp.";
        }

        if (hasAttemptedUpiPayment) {
          window.alert(
            "Thank you! If your UPI payment was successful, please mention 'Paid via UPI' in WhatsApp. Your order details will now be sent."
          );
        }

        var phoneNumber = "917908789954"; // Replace with restaurant's WhatsApp number
        var url =
          "https://wa.me/" +
          encodeURIComponent(phoneNumber) +
          "?text=" +
          encodeURIComponent(payload.message + detailsText);

        window.open(url, "_blank");
        closeOrderDetailsModal();
      });
    }
  });
})();
