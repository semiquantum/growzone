import { initMobileNav, initReveal, markActiveNav, setCurrentYear } from "./platform-common.js";

initMobileNav();
markActiveNav("pricing");
initReveal();
setCurrentYear();

const billingCycleEl = document.getElementById("billingCycle");
const statusEl = document.getElementById("billingStatus");
const razorpayChip = document.getElementById("razorpayChip");
const orderBar = document.getElementById("orderBar");
const paymentBar = document.getElementById("paymentBar");
const planButtons = document.querySelectorAll(".plan-btn");
const priceEls = document.querySelectorAll("[data-price]");

const priceMap = {
  monthly: { free: "$0", pro: "$29", premium: "$99", suffix: "/month" },
  yearly: { free: "$0", pro: "$279", premium: "$950", suffix: "/year" }
};

let razorpayEnabled = false;
let razorpayKeyId = "";

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#7d241b" : "#4f6479";
  statusEl.style.borderColor = isError ? "rgba(192,57,43,0.35)" : "#d6e4ee";
  statusEl.style.background = isError ? "rgba(192,57,43,0.08)" : "#f7fbff";
}

function updatePriceLabels() {
  const cycle = billingCycleEl.value;
  priceEls.forEach((el) => {
    const plan = el.getAttribute("data-price");
    if (!plan || !priceMap[cycle]) {
      return;
    }
    const value = priceMap[cycle][plan];
    const suffix = priceMap[cycle].suffix;
    el.innerHTML = `${value}<span>${suffix}</span>`;
  });
}

async function loadRazorpayConfig() {
  try {
    const response = await fetch("/api/razorpay/config");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    razorpayEnabled = Boolean(data.enabled);
    razorpayKeyId = data.key_id || "";

    if (!razorpayEnabled) {
      razorpayChip.textContent = "Razorpay Not Ready";
      razorpayChip.classList.remove("chip-ok");
      setStatus("Razorpay test credentials are missing on server.", true);
      return;
    }

    razorpayChip.textContent = "Razorpay Ready";
    razorpayChip.classList.add("chip-ok");
    setStatus("Razorpay test checkout is ready.");
  } catch (error) {
    razorpayChip.textContent = "Razorpay Error";
    razorpayChip.classList.remove("chip-ok");
    setStatus(`Unable to load Razorpay config: ${error.message}`, true);
  }
}

async function verifyPayment(payload) {
  const response = await fetch("/api/razorpay/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok || !data.verified) {
    throw new Error(data.error || "Payment verification failed.");
  }

  return data;
}

async function startCheckout(plan) {
  const cycle = billingCycleEl.value;

  if (plan === "free") {
    window.location.href = "login.html#signup";
    return;
  }

  if (!razorpayEnabled || !razorpayKeyId) {
    setStatus("Razorpay is not enabled yet. Check backend credentials.", true);
    return;
  }

  orderBar.style.width = "30%";
  paymentBar.style.width = "0%";
  setStatus("Creating payment order...");

  try {
    const orderRes = await fetch("/api/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billing_cycle: cycle })
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      throw new Error(orderData.error || "Unable to create order.");
    }

    orderBar.style.width = "100%";
    setStatus("Order created. Opening Razorpay checkout...");

    if (typeof window.Razorpay !== "function") {
      throw new Error("Razorpay checkout SDK did not load.");
    }

    const options = {
      key: razorpayKeyId,
      amount: orderData.order.amount,
      currency: orderData.order.currency,
      name: "GrowZone",
      description: `${plan.toUpperCase()} plan (${cycle})`,
      order_id: orderData.order.id,
      prefill: {
        name: "GrowZone User",
        email: "user@example.com"
      },
      notes: {
        plan,
        billing_cycle: cycle
      },
      theme: { color: "#0f6b95" },
      handler: async function (responsePayload) {
        try {
          await verifyPayment(responsePayload);
          paymentBar.style.width = "100%";
          setStatus(`Payment verified successfully for ${plan.toUpperCase()} (${cycle}).`);
        } catch (verifyError) {
          setStatus(verifyError.message, true);
        }
      },
      modal: {
        ondismiss: function () {
          setStatus("Checkout closed before completion.", true);
        }
      }
    };

    const checkout = new window.Razorpay(options);
    checkout.on("payment.failed", function (failure) {
      const reason = failure?.error?.description || "Payment failed. Try again.";
      setStatus(reason, true);
    });

    checkout.open();
  } catch (error) {
    setStatus(error.message, true);
  }
}

billingCycleEl.addEventListener("change", updatePriceLabels);
planButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const plan = btn.getAttribute("data-plan");
    if (plan) {
      startCheckout(plan);
    }
  });
});

updatePriceLabels();
loadRazorpayConfig();
